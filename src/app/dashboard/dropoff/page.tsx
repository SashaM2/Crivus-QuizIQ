"use client";

import { useEffect, useState, useCallback } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import TrackerSelect from "@/components/TrackerSelect";
import DateRangePicker from "@/components/DateRangePicker";
import GranularitySelect from "@/components/GranularitySelect";
import MetricsChart from "@/components/MetricsChart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface DropoffPoint {
  date: string;
  starts: number;
  completes: number;
  dropoff: number;
}

export default function DropoffPage() {
  const [trackerId, setTrackerId] = useState<string>("");
  const [quizId, setQuizId] = useState<string>("");
  const [from, setFrom] = useState<number | undefined>();
  const [to, setTo] = useState<number | undefined>();
  const [groupBy, setGroupBy] = useState<"day" | "month" | "year">("day");
  const [dropoff, setDropoff] = useState<DropoffPoint[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchDropoff = useCallback(async () => {
    if (!trackerId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        tracker_id: trackerId,
        groupBy,
      });
      if (quizId) params.append("quiz_id", quizId);
      if (from) params.append("from", from.toString());
      if (to) params.append("to", to.toString());

      const res = await fetch(`/api/stats/dropoff?${params}`);
      if (res.ok) {
        const data = await res.json();
        setDropoff(data);
      }
    } catch (err) {
      console.error("Failed to fetch dropoff:", err);
    } finally {
      setLoading(false);
    }
  }, [trackerId, quizId, from, to, groupBy]);

  useEffect(() => {
    if (trackerId) {
      fetchDropoff();
    }
  }, [trackerId, fetchDropoff]);

  const chartData = dropoff.map((d) => ({
    date: d.date,
    starts: d.starts,
    completes: d.completes,
    dropoff: d.dropoff,
  }));

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Drop-off</h1>
          <p className="text-gray-600 mt-1">Taxa de abandono dos quizzes</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <TrackerSelect value={trackerId} onChange={setTrackerId} />
              <div className="space-y-2">
                <Label htmlFor="quiz-id">Quiz ID (opcional)</Label>
                <Input
                  id="quiz-id"
                  placeholder="quiz-123"
                  value={quizId}
                  onChange={(e) => setQuizId(e.target.value)}
                />
              </div>
              <GranularitySelect value={groupBy} onChange={setGroupBy} />
            </div>
            <div className="mt-4">
              <DateRangePicker from={from} to={to} onChange={(f, t) => { setFrom(f); setTo(t); }} />
            </div>
            <div className="mt-4">
              <Button onClick={fetchDropoff} disabled={!trackerId || loading}>
                Atualizar
              </Button>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : dropoff.length > 0 ? (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Gráfico de Drop-off</CardTitle>
                <CardDescription>Visualização da taxa de abandono ao longo do tempo</CardDescription>
              </CardHeader>
              <CardContent>
                <MetricsChart data={chartData} groupBy={groupBy} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Dados de Drop-off</CardTitle>
                <CardDescription>Dados detalhados por período</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Data</th>
                        <th className="text-right p-2">Inícios</th>
                        <th className="text-right p-2">Completos</th>
                        <th className="text-right p-2">Drop-off</th>
                        <th className="text-right p-2">Taxa</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dropoff.map((d, idx) => {
                        const rate = d.starts > 0 ? ((d.dropoff / d.starts) * 100).toFixed(2) : "0.00";
                        return (
                          <tr key={idx} className="border-b">
                            <td className="p-2 font-medium">{d.date}</td>
                            <td className="p-2 text-right">{d.starts}</td>
                            <td className="p-2 text-right">{d.completes}</td>
                            <td className="p-2 text-right text-red-600">{d.dropoff}</td>
                            <td className="p-2 text-right font-semibold">{rate}%</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </>
        ) : trackerId ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              Nenhum dado de drop-off disponível para este período
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              Selecione um tracker para visualizar o drop-off
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}

