"use client";

import { useEffect, useState, useCallback } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import TrackerSelect from "@/components/TrackerSelect";
import DateRangePicker from "@/components/DateRangePicker";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface UTMStat {
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  visits: number;
  starts: number;
  completes: number;
}

export default function UTMPage() {
  const [trackerId, setTrackerId] = useState<string>("");
  const [from, setFrom] = useState<number | undefined>();
  const [to, setTo] = useState<number | undefined>();
  const [utmStats, setUtmStats] = useState<UTMStat[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchUTMStats = useCallback(async () => {
    if (!trackerId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ tracker_id: trackerId });
      if (from) params.append("from", from.toString());
      if (to) params.append("to", to.toString());

      const res = await fetch(`/api/stats/utm?${params}`);
      if (res.ok) {
        const data = await res.json();
        setUtmStats(data);
      }
    } catch (err) {
      console.error("Failed to fetch UTM stats:", err);
    } finally {
      setLoading(false);
    }
  }, [trackerId, from, to]);

  useEffect(() => {
    if (trackerId) {
      fetchUTMStats();
    }
  }, [trackerId, fetchUTMStats]);

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Estatísticas UTM</h1>
          <p className="text-gray-600 mt-1">Performance por campanha UTM</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TrackerSelect value={trackerId} onChange={setTrackerId} />
              <div className="flex items-end">
                <Button onClick={fetchUTMStats} className="w-full" disabled={!trackerId || loading}>
                  Atualizar
                </Button>
              </div>
            </div>
            <div className="mt-4">
              <DateRangePicker from={from} to={to} onChange={(f, t) => { setFrom(f); setTo(t); }} />
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : utmStats.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Estatísticas UTM</CardTitle>
              <CardDescription>Performance por campanha de marketing</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Source</TableHead>
                      <TableHead>Medium</TableHead>
                      <TableHead>Campaign</TableHead>
                      <TableHead className="text-right">Visitas</TableHead>
                      <TableHead className="text-right">Inícios</TableHead>
                      <TableHead className="text-right">Completos</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {utmStats.map((stat, index) => (
                      <TableRow key={index}>
                        <TableCell>{stat.utm_source || "-"}</TableCell>
                        <TableCell>{stat.utm_medium || "-"}</TableCell>
                        <TableCell>{stat.utm_campaign || "-"}</TableCell>
                        <TableCell className="text-right font-semibold">{stat.visits}</TableCell>
                        <TableCell className="text-right">{stat.starts}</TableCell>
                        <TableCell className="text-right">{stat.completes}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        ) : trackerId ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              Nenhum dado UTM disponível para este período
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              Selecione um tracker para visualizar as estatísticas UTM
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}

