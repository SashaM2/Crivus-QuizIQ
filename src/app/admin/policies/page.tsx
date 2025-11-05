"use client";

import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save } from "lucide-react";

interface Policies {
  maxTrackersPerUser: number;
  maxCollectRpsPerOrigin: number;
  retentionDays: number;
  allowedOrigins: string[];
}

export default function AdminPoliciesPage() {
  const [policies, setPolicies] = useState<Policies>({
    maxTrackersPerUser: 10,
    maxCollectRpsPerOrigin: 10,
    retentionDays: 365,
    allowedOrigins: [],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [originsInput, setOriginsInput] = useState("");

  useEffect(() => {
    fetchPolicies();
  }, []);

  const fetchPolicies = async () => {
    try {
      // TODO: Criar endpoint /api/admin/policies
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch policies:", err);
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // TODO: Criar endpoint /api/admin/policies
      alert("Políticas atualizadas com sucesso!");
    } catch (err) {
      console.error("Failed to save policies:", err);
      alert("Erro ao salvar políticas");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Políticas Globais</h1>
          <p className="text-gray-600 mt-1">Configure limites e regras globais do sistema</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Configurações de Políticas</CardTitle>
            <CardDescription>Defina os limites e regras aplicados a todos os usuários</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="max-trackers">Máx. Trackers por Usuário</Label>
                <Input
                  id="max-trackers"
                  type="number"
                  value={policies.maxTrackersPerUser}
                  onChange={(e) =>
                    setPolicies({ ...policies, maxTrackersPerUser: parseInt(e.target.value) || 0 })
                  }
                  min="1"
                />
              </div>
              <div>
                <Label htmlFor="max-rps">Máx. RPS por Origem</Label>
                <Input
                  id="max-rps"
                  type="number"
                  value={policies.maxCollectRpsPerOrigin}
                  onChange={(e) =>
                    setPolicies({ ...policies, maxCollectRpsPerOrigin: parseInt(e.target.value) || 0 })
                  }
                  min="1"
                />
              </div>
              <div>
                <Label htmlFor="retention">Dias de Retenção</Label>
                <Input
                  id="retention"
                  type="number"
                  value={policies.retentionDays}
                  onChange={(e) =>
                    setPolicies({ ...policies, retentionDays: parseInt(e.target.value) || 0 })
                  }
                  min="1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="origins">Origens Permitidas (uma por linha)</Label>
              <textarea
                id="origins"
                className="w-full min-h-[100px] px-3 py-2 border rounded-md"
                value={originsInput}
                onChange={(e) => setOriginsInput(e.target.value)}
                placeholder="https://example.com&#10;https://another-site.com"
              />
              <p className="text-sm text-gray-500 mt-1">
                Deixe vazio para permitir todas as origens
              </p>
            </div>

            <Button onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Salvando..." : "Salvar Políticas"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

