"use client";

import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import TrackerSelect from "@/components/TrackerSelect";
import DateRangePicker from "@/components/DateRangePicker";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface TopPage {
  path: string;
  visits: number;
}

export default function TopPagesPage() {
  const [trackerId, setTrackerId] = useState<string>("");
  const [from, setFrom] = useState<number | undefined>();
  const [to, setTo] = useState<number | undefined>();
  const [topPages, setTopPages] = useState<TopPage[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (trackerId) {
      fetchTopPages();
    }
  }, [trackerId, from, to]);

  const fetchTopPages = async () => {
    if (!trackerId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ tracker_id: trackerId });
      if (from) params.append("from", from.toString());
      if (to) params.append("to", to.toString());

      const res = await fetch(`/api/stats/top-pages?${params}`);
      if (res.ok) {
        const data = await res.json();
        setTopPages(data);
      }
    } catch (err) {
      console.error("Failed to fetch top pages:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Top Páginas</h1>
          <p className="text-gray-600 mt-1">Páginas mais visitadas do seu tracker</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TrackerSelect value={trackerId} onChange={setTrackerId} />
              <div className="flex items-end">
                <Button onClick={fetchTopPages} className="w-full" disabled={!trackerId || loading}>
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
        ) : topPages.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Páginas Mais Visitadas</CardTitle>
              <CardDescription>Ranking das páginas com mais visitas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Path</TableHead>
                      <TableHead className="text-right">Visitas</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topPages.map((page, index) => (
                      <TableRow key={page.path}>
                        <TableCell className="font-medium">{index + 1}</TableCell>
                        <TableCell className="font-mono text-sm">{page.path}</TableCell>
                        <TableCell className="text-right font-semibold">{page.visits}</TableCell>
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
              Nenhum dado disponível para este período
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              Selecione um tracker para visualizar as páginas mais visitadas
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}

