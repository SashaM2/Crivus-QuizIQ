"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Copy, Eye, Pause, Play, Trash2, ExternalLink } from "lucide-react";

export default function TrackersPage() {
  const router = useRouter();
  const [trackers, setTrackers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [formData, setFormData] = useState({ name: "", siteUrl: "" });
  const [error, setError] = useState("");

  useEffect(() => {
    fetchTrackers();
  }, []);

  const fetchTrackers = async () => {
    try {
      const res = await fetch("/api/trackers");
      if (res.ok) {
        const data = await res.json();
        setTrackers(data);
      }
    } catch (err) {
      console.error("Failed to fetch trackers:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch("/api/trackers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Falha ao criar tracker");
        return;
      }

      setShowCreate(false);
      setFormData({ name: "", siteUrl: "" });
      fetchTrackers();
    } catch (err) {
      setError("Erro de rede");
    }
  };

  const handleToggleActive = async (trackerId: string, active: boolean) => {
    try {
      await fetch(`/api/trackers/${trackerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !active }),
      });
      fetchTrackers();
    } catch (err) {
      console.error("Falha ao alterar tracker:", err);
    }
  };

  const handleDelete = async (trackerId: string) => {
    if (!confirm("Tem certeza que deseja excluir este tracker?")) return;

    try {
      await fetch(`/api/trackers/${trackerId}`, {
        method: "DELETE",
      });
      fetchTrackers();
    } catch (err) {
      console.error("Falha ao excluir tracker:", err);
    }
  };

  const handleCopySnippet = async (trackerId: string) => {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
    const snippet = `<script>
(function(){
  const TRACKER_ID = "${trackerId}";
  const COLLECT_URL = "${appUrl}/api/collect";
  const sid = (localStorage.qsid ||= (crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)));
  const qs = new URLSearchParams(location.search);
  const utm = Object.fromEntries(["utm_source","utm_medium","utm_campaign","utm_term","utm_content"].map(k=>[k,qs.get(k)]));
  function send(ev, extra={}){
    const body = JSON.stringify({tracker_id: TRACKER_ID, ev, ts: Date.now(), sid, page_url: location.href, path: location.pathname, ref: document.referrer || null, sw: screen.width, sh: screen.height, ...utm, ...extra});
    (navigator.sendBeacon && navigator.sendBeacon(COLLECT_URL, body)) || fetch(COLLECT_URL, { method:"POST", headers:{ "Content-Type":"application/json" }, body });
  }
  send("page_view");
  window.qz = {
    start:(quiz_id)=>send("quiz_start",{quiz_id}),
    qView:(quiz_id,q)=>send("question_view",{quiz_id,question_id:q}),
    aPick:(quiz_id,q,a)=>send("answer_select",{quiz_id,question_id:q,answer_id:a}),
    qSubmit:(quiz_id,q,correct)=>send("question_submit",{quiz_id,question_id:q,correct}),
    done:(quiz_id,score)=>send("quiz_complete",{quiz_id,score}),
    lead:(quiz_id,{email,name,phone})=>send("lead_capture",{quiz_id,lead:{email,name,phone}}),
    cta:(quiz_id,label)=>send("cta_click",{quiz_id,label})
  };
  document.addEventListener("click",(e)=>{
    const el = e.target.closest("[data-qz-cta]");
    if(!el) return;
    send("cta_click",{ quiz_id: el.getAttribute("data-qz-id"), label: el.getAttribute("data-qz-cta") });
  });
  const ps = history.pushState;
  history.pushState = function(){ ps.apply(this, arguments); send("page_view"); };
  addEventListener("popstate",()=> send("page_view"));
})();
</script>`;
    await navigator.clipboard.writeText(snippet);
    alert("Snippet copiado!");
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Meus Trackers</h1>
            <p className="text-gray-600 mt-1">Gerencie seus trackers de quiz</p>
          </div>
          <Button onClick={() => setShowCreate(!showCreate)} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Criar Tracker
          </Button>
        </div>

        {showCreate && (
          <Card>
            <CardHeader>
              <CardTitle>Criar Novo Tracker</CardTitle>
              <CardDescription>Configure um novo tracker para seu site</CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Meu Site Principal"
                  />
                </div>
                <div>
                  <Label htmlFor="siteUrl">URL do Site</Label>
                  <Input
                    id="siteUrl"
                    type="url"
                    required
                    value={formData.siteUrl}
                    onChange={(e) => setFormData({ ...formData, siteUrl: e.target.value })}
                    placeholder="https://meusite.com"
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit">Criar</Button>
                  <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {trackers.length === 0 && !showCreate ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-500 mb-4">Ainda não há trackers. Crie seu primeiro tracker!</p>
              <Button onClick={() => setShowCreate(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Tracker
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {trackers.map((tracker) => (
              <Card key={tracker.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{tracker.name}</CardTitle>
                      <CardDescription className="mt-1 font-mono text-xs">
                        {tracker.trackerId}
                      </CardDescription>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs rounded ${
                        tracker.active
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {tracker.active ? "Ativo" : "Inativo"}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600 flex items-center gap-1">
                      <ExternalLink className="h-3 w-3" />
                      {tracker.siteUrl}
                    </p>
                    <div className="flex flex-wrap gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopySnippet(tracker.trackerId)}
                        className="flex-1"
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Snippet
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/my/trackers/${tracker.trackerId}`)}
                        className="flex-1"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Ver
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleActive(tracker.trackerId, tracker.active)}
                      >
                        {tracker.active ? (
                          <Pause className="h-3 w-3" />
                        ) : (
                          <Play className="h-3 w-3" />
                        )}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(tracker.trackerId)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
