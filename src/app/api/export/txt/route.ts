import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/server/auth";
import { canAccessTracker } from "@/server/trackers";
import { generateTxt } from "@/server/exportTxt";
import { z } from "zod";

const exportTxtSchema = z.object({
  tracker_id: z.string(),
  from: z.number().optional(),
  to: z.number().optional(),
  groupBy: z.enum(["day", "month", "year"]).optional(),
  sections: z.array(z.string()).optional(),
  locale: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validated = exportTxtSchema.parse(body);

    const canAccess = await canAccessTracker(user.userId, validated.tracker_id, user.role);
    if (!canAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const txt = await generateTxt({
      trackerId: validated.tracker_id,
      from: validated.from,
      to: validated.to,
      groupBy: validated.groupBy || "day",
      sections: validated.sections || ["overview", "top-pages", "utm", "leads"],
      locale: validated.locale || "pt",
    });

    return new NextResponse(txt, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="report-${validated.tracker_id}-${Date.now()}.txt"`,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    console.error("TXT export error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

