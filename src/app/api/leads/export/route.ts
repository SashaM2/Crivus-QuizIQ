import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/server/auth";
import { canAccessTracker } from "@/server/trackers";
import { db } from "@/server/db";
import { leads } from "@/server/db/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { z } from "zod";

const exportLeadsSchema = z.object({
  tracker_id: z.string(),
  from: z.number().optional(),
  to: z.number().optional(),
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
    };

    const validated = exportLeadsSchema.parse(params);

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

    const leadsList = await db
      .select()
      .from(leads)
      .where(and(...conditions))
      .orderBy(leads.createdAt);

    // Generate CSV
    const headers = ["Email", "Name", "Phone", "Timestamp", "Created At"];
    const rows = leadsList.map((lead) => [
      lead.email || "",
      lead.name || "",
      lead.phone || "",
      new Date(lead.ts).toISOString(),
      lead.createdAt.toISOString(),
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")),
    ].join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="leads-${validated.tracker_id}-${Date.now()}.csv"`,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

