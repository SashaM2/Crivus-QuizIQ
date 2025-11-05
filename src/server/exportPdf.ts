import puppeteer from "puppeteer";
import { getOverview, getTopPages, getDropoff, getUTMStats } from "./stats";
import { db } from "./db";
import { trackers } from "./db/schema";
import { eq } from "drizzle-orm";

export interface ExportPdfParams {
  trackerId: string;
  from?: number;
  to?: number;
  groupBy?: "day" | "month" | "year";
  sections?: string[];
  locale?: string;
}

export async function generatePdf(params: ExportPdfParams): Promise<Buffer> {
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

  const html = generateHtml(tracker[0], stats, from, to, groupBy, locale);

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdf = await page.pdf({
      format: "A4",
      landscape: true,
      printBackground: true,
      margin: {
        top: "20mm",
        right: "20mm",
        bottom: "20mm",
        left: "20mm",
      },
    });

    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}

function generateHtml(
  tracker: any,
  stats: any,
  from: number | undefined,
  to: number | undefined,
  groupBy: string,
  locale: string
): string {
  const period = from && to
    ? `${new Date(from).toLocaleDateString(locale)} - ${new Date(to).toLocaleDateString(locale)}`
    : "All time";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; }
    h1 { color: #333; }
    h2 { color: #666; margin-top: 30px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f2f2f2; }
    .kpi { display: flex; gap: 20px; margin: 20px 0; }
    .kpi-item { flex: 1; padding: 15px; background: #f9f9f9; border-radius: 8px; }
    .kpi-value { font-size: 24px; font-weight: bold; }
    .kpi-label { color: #666; font-size: 14px; }
  </style>
</head>
<body>
  <h1>${tracker.name}</h1>
  <p><strong>Tracker ID:</strong> ${tracker.trackerId}</p>
  <p><strong>Period:</strong> ${period}</p>
  <p><strong>Granularity:</strong> ${groupBy}</p>

  ${stats.overview ? `
    <h2>Overview</h2>
    <div class="kpi">
      <div class="kpi-item">
        <div class="kpi-value">${stats.overview.visits}</div>
        <div class="kpi-label">Visits</div>
      </div>
      <div class="kpi-item">
        <div class="kpi-value">${stats.overview.starts}</div>
        <div class="kpi-label">Starts</div>
      </div>
      <div class="kpi-item">
        <div class="kpi-value">${stats.overview.completes}</div>
        <div class="kpi-label">Completes</div>
      </div>
      <div class="kpi-item">
        <div class="kpi-value">${stats.overview.completionRate}%</div>
        <div class="kpi-label">Completion Rate</div>
      </div>
      <div class="kpi-item">
        <div class="kpi-value">${stats.overview.leads}</div>
        <div class="kpi-label">Leads</div>
      </div>
    </div>
    <h3>Time Series</h3>
    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>Visits</th>
          <th>Starts</th>
          <th>Completes</th>
          <th>Leads</th>
        </tr>
      </thead>
      <tbody>
        ${stats.overview.timeseries.map((ts: any) => `
          <tr>
            <td>${ts.date}</td>
            <td>${ts.visits}</td>
            <td>${ts.starts}</td>
            <td>${ts.completes}</td>
            <td>${ts.leads}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  ` : ""}

  ${stats.topPages ? `
    <h2>Top Pages</h2>
    <table>
      <thead>
        <tr>
          <th>Path</th>
          <th>Visits</th>
        </tr>
      </thead>
      <tbody>
        ${stats.topPages.map((page: any) => `
          <tr>
            <td>${page.path}</td>
            <td>${page.visits}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  ` : ""}

  ${stats.utm ? `
    <h2>UTM Stats</h2>
    <table>
      <thead>
        <tr>
          <th>Source</th>
          <th>Medium</th>
          <th>Campaign</th>
          <th>Visits</th>
          <th>Starts</th>
          <th>Completes</th>
        </tr>
      </thead>
      <tbody>
        ${stats.utm.map((utm: any) => `
          <tr>
            <td>${utm.utm_source || "-"}</td>
            <td>${utm.utm_medium || "-"}</td>
            <td>${utm.utm_campaign || "-"}</td>
            <td>${utm.visits}</td>
            <td>${utm.starts}</td>
            <td>${utm.completes}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  ` : ""}
</body>
</html>
  `;
}

