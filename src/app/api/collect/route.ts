import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { trackers, events, leads } from "@/server/db/schema";
import { eq, and } from "drizzle-orm";
import { checkOriginAllowed } from "@/server/policies";
import { checkCollectRateLimit } from "@/server/rateLimit";
import { z } from "zod";

const collectSchema = z.object({
  tracker_id: z.string(),
  ev: z.string(),
  ts: z.number(),
  sid: z.string(),
  page_url: z.string().max(1024),
  path: z.string().max(1024),
  ref: z.string().max(1024).nullable().optional(),
  utm_source: z.string().nullable().optional(),
  utm_medium: z.string().nullable().optional(),
  utm_campaign: z.string().nullable().optional(),
  utm_term: z.string().nullable().optional(),
  utm_content: z.string().nullable().optional(),
  sw: z.number().nullable().optional(),
  sh: z.number().nullable().optional(),
  quiz_id: z.string().nullable().optional(),
  question_id: z.string().nullable().optional(),
  answer_id: z.string().nullable().optional(),
  extra: z.record(z.any()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = collectSchema.parse(body);

    // Check tracker exists and is active
    const tracker = await db
      .select()
      .from(trackers)
      .where(eq(trackers.trackerId, validated.tracker_id))
      .limit(1);

    if (!tracker.length) {
      return NextResponse.json({ error: "Tracker not found" }, { status: 404 });
    }

    if (!tracker[0].active || tracker[0].revokedAt) {
      return NextResponse.json({ error: "Tracker inactive" }, { status: 403 });
    }

    // Extract origin from page_url
    let origin: string;
    try {
      const url = new URL(validated.page_url);
      origin = `${url.protocol}//${url.host}`;
    } catch {
      return NextResponse.json({ error: "Invalid page_url" }, { status: 400 });
    }

    // Check origin is allowed
    const originAllowed = await checkOriginAllowed(origin);
    if (!originAllowed) {
      return NextResponse.json({ error: "Origin not allowed" }, { status: 403 });
    }

    // Check if origin is in tracker's allowed origins
    if (tracker[0].origins.length > 0 && !tracker[0].origins.includes(origin)) {
      return NextResponse.json({ error: "Origin not allowed for this tracker" }, { status: 403 });
    }

    // Rate limiting
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
    const rateLimit = await checkCollectRateLimit(origin, ip, validated.sid);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded", resetAt: rateLimit.resetAt },
        { status: 429 }
      );
    }

    // Insert event
    await db.insert(events).values({
      ts: validated.ts,
      ev: validated.ev,
      sid: validated.sid,
      trackerId: validated.tracker_id,
      pageUrl: validated.page_url.substring(0, 1024),
      path: validated.path.substring(0, 1024),
      ref: validated.ref ? validated.ref.substring(0, 1024) : null,
      utmSource: validated.utm_source || null,
      utmMedium: validated.utm_medium || null,
      utmCampaign: validated.utm_campaign || null,
      utmTerm: validated.utm_term || null,
      utmContent: validated.utm_content || null,
      sw: validated.sw || null,
      sh: validated.sh || null,
      quizId: validated.quiz_id || null,
      questionId: validated.question_id || null,
      answerId: validated.answer_id || null,
      extra: validated.extra || null,
    });

    // Handle lead capture
    if (validated.ev === "lead_capture" && validated.extra?.lead) {
      const lead = validated.extra.lead;
      await db.insert(leads).values({
        ts: validated.ts,
        trackerId: validated.tracker_id,
        sid: validated.sid,
        email: lead.email || null,
        name: lead.name || null,
        phone: lead.phone || null,
        extra: lead,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.errors }, { status: 400 });
    }
    console.error("Collect error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

