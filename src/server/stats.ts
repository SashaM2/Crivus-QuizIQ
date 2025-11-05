import { db } from "./db";
import { events, leads } from "./db/schema";
import { eq, and, gte, lte, sql, count, desc } from "drizzle-orm";

export interface StatsParams {
  trackerId: string;
  from?: number;
  to?: number;
  groupBy?: "day" | "month" | "year";
}

export async function getOverview(params: StatsParams) {
  const { trackerId, from, to, groupBy = "day" } = params;

  let dateFormat: string;
  switch (groupBy) {
    case "day":
      dateFormat = "YYYY-MM-DD";
      break;
    case "month":
      dateFormat = "YYYY-MM";
      break;
    case "year":
      dateFormat = "YYYY";
      break;
  }

  const conditions = [eq(events.trackerId, trackerId)];
  if (from) {
    conditions.push(gte(events.ts, from));
  }
  if (to) {
    conditions.push(lte(events.ts, to));
  }

  // Total stats
  const totalStats = await db
    .select({
      visits: sql<number>`count(*) filter (where ${events.ev} = 'page_view')`,
      starts: sql<number>`count(*) filter (where ${events.ev} = 'quiz_start')`,
      completes: sql<number>`count(*) filter (where ${events.ev} = 'quiz_complete')`,
      leads: sql<number>`count(*) filter (where ${events.ev} = 'lead_capture')`,
    })
    .from(events)
    .where(and(...conditions))
    .limit(1);

  const stats = totalStats[0] || { visits: 0, starts: 0, completes: 0, leads: 0 };
  const completionRate = stats.starts > 0 ? (stats.completes / stats.starts) * 100 : 0;
  const leadRate = stats.visits > 0 ? (stats.leads / stats.visits) * 100 : 0;

  // Time series
  const timeSeries = await db
    .select({
      date: sql<string>`to_char(to_timestamp(${events.ts} / 1000), '${sql.raw(dateFormat)}')`,
      visits: sql<number>`count(*) filter (where ${events.ev} = 'page_view')`,
      starts: sql<number>`count(*) filter (where ${events.ev} = 'quiz_start')`,
      completes: sql<number>`count(*) filter (where ${events.ev} = 'quiz_complete')`,
      leads: sql<number>`count(*) filter (where ${events.ev} = 'lead_capture')`,
    })
    .from(events)
    .where(and(...conditions))
    .groupBy(sql`to_char(to_timestamp(${events.ts} / 1000), '${sql.raw(dateFormat)}')`)
    .orderBy(sql`to_char(to_timestamp(${events.ts} / 1000), '${sql.raw(dateFormat)}')`);

  return {
    visits: stats.visits || 0,
    starts: stats.starts || 0,
    completes: stats.completes || 0,
    completionRate: Number(completionRate.toFixed(2)),
    leads: stats.leads || 0,
    leadRate: Number(leadRate.toFixed(2)),
    timeseries: timeSeries,
  };
}

export async function getTopPages(params: StatsParams) {
  const { trackerId, from, to } = params;

  const conditions = [eq(events.trackerId, trackerId), eq(events.ev, "page_view")];
  if (from) {
    conditions.push(gte(events.ts, from));
  }
  if (to) {
    conditions.push(lte(events.ts, to));
  }

  const topPages = await db
    .select({
      path: events.path,
      visits: count(),
    })
    .from(events)
    .where(and(...conditions))
    .groupBy(events.path)
    .orderBy(desc(count()))
    .limit(20);

  return topPages;
}

export async function getDropoff(params: StatsParams & { quizId?: string }) {
  const { trackerId, quizId, from, to, groupBy = "day" } = params;

  let dateFormat: string;
  switch (groupBy) {
    case "day":
      dateFormat = "YYYY-MM-DD";
      break;
    case "month":
      dateFormat = "YYYY-MM";
      break;
    case "year":
      dateFormat = "YYYY";
      break;
  }

  const conditions = [eq(events.trackerId, trackerId)];
  if (quizId) {
    conditions.push(eq(events.quizId, quizId));
  }
  if (from) {
    conditions.push(gte(events.ts, from));
  }
  if (to) {
    conditions.push(lte(events.ts, to));
  }

  const dropoff = await db
    .select({
      date: sql<string>`to_char(to_timestamp(${events.ts} / 1000), '${sql.raw(dateFormat)}')`,
      starts: sql<number>`count(*) filter (where ${events.ev} = 'quiz_start')`,
      completes: sql<number>`count(*) filter (where ${events.ev} = 'quiz_complete')`,
      dropoff: sql<number>`(count(*) filter (where ${events.ev} = 'quiz_start') - count(*) filter (where ${events.ev} = 'quiz_complete'))`,
    })
    .from(events)
    .where(and(...conditions))
    .groupBy(sql`to_char(to_timestamp(${events.ts} / 1000), '${sql.raw(dateFormat)}')`)
    .orderBy(sql`to_char(to_timestamp(${events.ts} / 1000), '${sql.raw(dateFormat)}')`);

  return dropoff;
}

export async function getUTMStats(params: StatsParams) {
  const { trackerId, from, to } = params;

  const conditions = [eq(events.trackerId, trackerId)];
  if (from) {
    conditions.push(gte(events.ts, from));
  }
  if (to) {
    conditions.push(lte(events.ts, to));
  }

  const utmStats = await db
    .select({
      utm_source: events.utmSource,
      utm_medium: events.utmMedium,
      utm_campaign: events.utmCampaign,
      visits: sql<number>`count(*) filter (where ${events.ev} = 'page_view')`,
      starts: sql<number>`count(*) filter (where ${events.ev} = 'quiz_start')`,
      completes: sql<number>`count(*) filter (where ${events.ev} = 'quiz_complete')`,
    })
    .from(events)
    .where(and(...conditions))
    .groupBy(events.utmSource, events.utmMedium, events.utmCampaign)
    .orderBy(desc(sql`count(*)`))
    .limit(50);

  return utmStats;
}

