"use client";

import { useEffect, useState, useCallback } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import TrackerSelect from "@/components/TrackerSelect";
import DateRangePicker from "@/components/DateRangePicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Search } from "lucide-react";

interface Lead {
  id: number;
  email: string | null;
  name: string | null;
  phone: string | null;
  createdAt: string;
}

export default function LeadsPage() {
  const [trackerId, setTrackerId] = useState<string>("");
  const [from, setFrom] = useState<number | undefined>();
  const [to, setTo] = useState<number | undefined>();
  const [search, setSearch] = useState("");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchLeads = useCallback(async () => {
    if (!trackerId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        tracker_id: trackerId,
        page: page.toString(),
        limit: "50",
      });
      if (from) params.append("from", from.toString());
      if (to) params.append("to", to.toString());
      if (search) params.append("search", search);

      const res = await fetch(`/api/leads/list?${params}`);
      if (res.ok) {
        const data = await res.json();
        setLeads(data.leads || []);
        setTotal(data.pagination?.total || 0);
      }
    } catch (err) {
      console.error("Failed to fetch leads:", err);
    } finally {
      setLoading(false);
    }
  }, [trackerId, from, to, search, page]);

  useEffect(() => {
    if (trackerId) {
      fetchLeads();
    }
  }, [trackerId, fetchLeads]);

  const handleExport = async () => {
    if (!trackerId) return;
    const params = new URLSearchParams({ tracker_id: trackerId });
    if (from) params.append("from", from.toString());
    if (to) params.append("to", to.toString());

    window.open(`/api/leads/export?${params}`, "_blank");
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Leads</h1>
            <p className="text-gray-600 mt-1">Leads capturados pelos seus quizzes</p>
          </div>
          {trackerId && (
            <Button onClick={handleExport} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TrackerSelect value={trackerId} onChange={setTrackerId} />
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por email, nome ou telefone..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
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
        ) : leads.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Leads ({total})</CardTitle>
              <CardDescription>Lista de leads capturados</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead>Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leads.map((lead) => (
                      <TableRow key={lead.id}>
                        <TableCell className="font-medium">{lead.email || "-"}</TableCell>
                        <TableCell>{lead.name || "-"}</TableCell>
                        <TableCell>{lead.phone || "-"}</TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {new Date(lead.createdAt).toLocaleDateString("pt-BR")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {total > 50 && (
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    Mostrando {Math.min((page - 1) * 50 + 1, total)} - {Math.min(page * 50, total)} de {total}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={page * 50 >= total}
                    >
                      Próximo
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ) : trackerId ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              Nenhum lead encontrado para este período
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              Selecione um tracker para visualizar os leads
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}

