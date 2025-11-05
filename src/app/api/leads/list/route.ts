import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/server/auth";
import { canAccessTracker } from "@/server/trackers";
import { db } from "@/server/db";
import { leads } from "@/server/db/schema";
import { eq, and, gte, lte, or, ilike, desc, sql } from "drizzle-orm";
import { z } from "zod";

const listLeadsSchema = z.object({
  tracker_id: z.string(),
  from: z.number().optional(),
  to: z.number().optional(),
  page: z.number().optional(),
  limit: z.number().optional(),
  search: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const params = {
      tracker_id: searchParams.get("tracker_id") || "",
      from: searchParams.get("from") ? Number(searchParams.get("from")) : undefined,
      to: searchParams.get("to") ? Number(searchParams.get("to")) : undefined,
      page: searchParams.get("page") ? Number(searchParams.get("page")) : 1,
      limit: searchParams.get("limit") ? Number(searchParams.get("limit")) : 50,
      search: searchParams.get("search") || undefined,
    };

    const validated = listLeadsSchema.parse(params);

    const canAccess = await canAccessTracker(user.userId, validated.tracker_id, user.role);
    if (!canAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const conditions = [eq(leads.trackerId, validated.tracker_id)];
    if (validated.from) {
      conditions.push(gte(leads.ts, validated.from));
    }
    if (validated.to) {
      conditions.push(lte(leads.ts, validated.to));
    }
    if (validated.search) {
      conditions.push(
        or(
          ilike(leads.email, `%${validated.search}%`),
          ilike(leads.name, `%${validated.search}%`),
          ilike(leads.phone, `%${validated.search}%`)
        )!
      );
    }

    const page = validated.page || 1;
    const limit = validated.limit || 50;
    const offset = (page - 1) * limit;

    const leadsList = await db
      .select()
      .from(leads)
      .where(and(...conditions))
      .orderBy(desc(leads.createdAt))
      .limit(limit)
      .offset(offset);

    const total = await db
      .select({ count: sql<number>`count(*)` })
      .from(leads)
      .where(and(...conditions))
      .limit(1);

    return NextResponse.json({
      leads: leadsList,
      pagination: {
        page,
        limit,
        total: total[0]?.count || 0,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

