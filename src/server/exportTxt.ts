import { getOverview, getTopPages, getDropoff, getUTMStats } from "./stats";
import { db } from "./db";
import { trackers } from "./db/schema";
import { eq } from "drizzle-orm";

export interface ExportTxtParams {
  trackerId: string;
  from?: number;
  to?: number;
  groupBy?: "day" | "month" | "year";
  sections?: string[];
  locale?: string;
}

export async function generateTxt(params: ExportTxtParams): Promise<string> {
  const { trackerId, from, to, groupBy = "day", sections = ["overview", "top-pages", "utm", "leads"], locale = "pt" } = params;

  const tracker = await db.select().from(trackers).where(eq(trackers.trackerId, trackerId)).limit(1);
  if (!tracker.length) {
    throw new Error("Tracker not found");
  }

  const stats = {
    overview: sections.includes("overview") ? await getOverview({ trackerId, from, to, groupBy }) : null,
    topPages: sections.includes("top-pages") ? await getTopPages({ trackerId, from, to }) : null,
    dropoff: sections.includes("dropoff") ? await getDropoff({ trackerId, from, to, groupBy }) : null,
    utm: sections.includes("utm") ? await getUTMStats({ trackerId, from, to }) : null,
  };

  const period = from && to
    ? `${new Date(from).toLocaleDateString(locale)} - ${new Date(to).toLocaleDateString(locale)}`
    : "All time";

  let output = "";
  output += `╔═══════════════════════════════════════════════════════════════╗\n`;
  output += `║                    CRIVUS QUIZIQ REPORT                     ║\n`;
  output += `╚═══════════════════════════════════════════════════════════════╝\n\n`;
  output += `Tracker: ${tracker[0].name}\n`;
  output += `Tracker ID: ${tracker[0].trackerId}\n`;
  output += `Period: ${period}\n`;
  output += `Granularity: ${groupBy}\n\n`;

  if (stats.overview) {
    output += `┌─────────────────────────────────────────────────────────────┐\n`;
    output += `│ OVERVIEW                                                    │\n`;
    output += `└─────────────────────────────────────────────────────────────┘\n\n`;
    output += `Visits:          ${stats.overview.visits}\n`;
    output += `Starts:          ${stats.overview.starts}\n`;
    output += `Completes:       ${stats.overview.completes}\n`;
    output += `Completion Rate: ${stats.overview.completionRate}%\n`;
    output += `Leads:           ${stats.overview.leads}\n`;
    output += `Lead Rate:       ${stats.overview.leadRate}%\n\n`;

    if (stats.overview.timeseries && stats.overview.timeseries.length > 0) {
      output += `Time Series:\n`;
      const table = formatTable(
        ["Date", "Visits", "Starts", "Completes", "Leads"],
        stats.overview.timeseries.map((ts: any) => [
          ts.date,
          String(ts.visits),
          String(ts.starts),
          String(ts.completes),
          String(ts.leads),
        ])
      );
      output += table;
      output += "\n";
    }
  }

  if (stats.topPages) {
    output += `┌─────────────────────────────────────────────────────────────┐\n`;
    output += `│ TOP PAGES                                                   │\n`;
    output += `└─────────────────────────────────────────────────────────────┘\n\n`;
    const table = formatTable(
      ["Path", "Visits"],
      stats.topPages.map((page: any) => [page.path, String(page.visits)])
    );
    output += table;
    output += "\n";
  }

  if (stats.utm) {
    output += `┌─────────────────────────────────────────────────────────────┐\n`;
    output += `│ UTM STATS                                                   │\n`;
    output += `└─────────────────────────────────────────────────────────────┘\n\n`;
    const table = formatTable(
      ["Source", "Medium", "Campaign", "Visits", "Starts", "Completes"],
      stats.utm.map((utm: any) => [
        utm.utm_source || "-",
        utm.utm_medium || "-",
        utm.utm_campaign || "-",
        String(utm.visits),
        String(utm.starts),
        String(utm.completes),
      ])
    );
    output += table;
    output += "\n";
  }

  return output;
}

function formatTable(headers: string[], rows: string[][]): string {
  const widths: number[] = headers.map((h) => h.length);

  rows.forEach((row) => {
    row.forEach((cell, i) => {
      if (i < widths.length) {
        widths[i] = Math.max(widths[i], cell.length);
      }
    });
  });

  let output = "";
  const separator = `+${headers.map((_, i) => "─".repeat(widths[i] + 2)).join("+")}+\n`;

  output += separator;
  output += `|${headers.map((h, i) => ` ${h.padEnd(widths[i])} `).join("|")}|\n`;
  output += separator;

  rows.forEach((row) => {
    output += `|${row.map((cell, i) => ` ${cell.padEnd(widths[i])} `).join("|")}|\n`;
  });

  output += separator;
  return output;
}

