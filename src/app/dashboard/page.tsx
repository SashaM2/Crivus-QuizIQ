"use client";

import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import KpiCard from "@/components/KpiCard";
import MetricsChart from "@/components/MetricsChart";
import TrackerSelect from "@/components/TrackerSelect";
import DateRangePicker from "@/components/DateRangePicker";
import GranularitySelect from "@/components/GranularitySelect";
import { Button } from "@/components/ui/button";
import { Download, Eye, Play, CheckCircle, Users } from "lucide-react";

export default function DashboardPage() {
  const [trackerId, setTrackerId] = useState<string>("");
  const [from, setFrom] = useState<number | undefined>();
  const [to, setTo] = useState<number | undefined>();
  const [groupBy, setGroupBy] = useState<"day" | "month" | "year">("day");
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (trackerId) {
      fetchStats();
    }
  }, [trackerId, from, to, groupBy]);

  const fetchStats = async () => {
    if (!trackerId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        tracker_id: trackerId,
        groupBy,
      });
      if (from) params.append("from", from.toString());
      if (to) params.append("to", to.toString());

      const res = await fetch(`/api/stats/overview?${params}`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: "pdf" | "txt") => {
    if (!trackerId) return;
    const res = await fetch(`/api/export/${format}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tracker_id: trackerId,
        from,
        to,
        groupBy,
        sections: ["overview", "top-pages", "utm", "leads"],
      }),
    });
    if (res.ok) {
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `report-${trackerId}-${Date.now()}.${format}`;
      a.click();
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">Visão geral das métricas do seu tracker</p>
          </div>
          {stats && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => handleExport("pdf")}>
                <Download className="h-4 w-4 mr-2" />
                Exportar PDF
              </Button>
              <Button variant="outline" onClick={() => handleExport("txt")}>
                <Download className="h-4 w-4 mr-2" />
                Exportar TXT
              </Button>
            </div>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
            <CardDescription>Selecione o tracker e período para visualizar as métricas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <TrackerSelect value={trackerId} onChange={setTrackerId} />
              <GranularitySelect value={groupBy} onChange={setGroupBy} />
              <div className="flex items-end">
                <Button onClick={fetchStats} className="w-full" disabled={!trackerId || loading}>
                  Atualizar
                </Button>
              </div>
            </div>
            <div className="mt-4">
              <DateRangePicker from={from} to={to} onChange={(f, t) => { setFrom(f); setTo(t); }} />
            </div>
          </CardContent>
        </Card>

        {loading && trackerId ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : stats ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <KpiCard
                title="Visitas"
                value={stats.visits || 0}
                icon={<Eye className="h-6 w-6" />}
              />
              <KpiCard
                title="Inícios"
                value={stats.starts || 0}
                icon={<Play className="h-6 w-6" />}
              />
              <KpiCard
                title="Completos"
                value={stats.completes || 0}
                icon={<CheckCircle className="h-6 w-6" />}
              />
              <KpiCard
                title="Taxa de Conclusão"
                value={`${stats.completionRate || 0}%`}
                subtitle={`${stats.completes || 0} de ${stats.starts || 0}`}
              />
              <KpiCard
                title="Leads"
                value={stats.leads || 0}
                icon={<Users className="h-6 w-6" />}
              />
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Série Temporal</CardTitle>
                <CardDescription>Evolução das métricas ao longo do tempo</CardDescription>
              </CardHeader>
              <CardContent>
                <MetricsChart data={stats.timeseries || []} groupBy={groupBy} />
              </CardContent>
            </Card>
          </>
        ) : (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              Selecione um tracker para visualizar as métricas
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
