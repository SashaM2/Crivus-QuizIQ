import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/server/auth";
import { canAccessTracker } from "@/server/trackers";
import { getOverview } from "@/server/stats";
import { z } from "zod";

const overviewSchema = z.object({
  tracker_id: z.string(),
  from: z.number().optional(),
  to: z.number().optional(),
  groupBy: z.enum(["day", "month", "year"]).optional(),
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
      groupBy: (searchParams.get("groupBy") as "day" | "month" | "year") || undefined,
    };

    const validated = overviewSchema.parse(params);

    const canAccess = await canAccessTracker(user.userId, validated.tracker_id, user.role);
    if (!canAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const stats = await getOverview({
      trackerId: validated.tracker_id,
      from: validated.from,
      to: validated.to,
      groupBy: validated.groupBy || "day",
    });

    return NextResponse.json(stats);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

