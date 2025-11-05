"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Check, ExternalLink, ArrowLeft } from "lucide-react";

export default function TrackerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const trackerId = params.id as string;
  const [tracker, setTracker] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [snippet, setSnippet] = useState("");
  const [copied, setCopied] = useState(false);

  const fetchTracker = useCallback(async () => {
    try {
      const res = await fetch(`/api/trackers/${trackerId}`);
      if (res.ok) {
        const data = await res.json();
        setTracker(data);
      } else {
        router.push("/my/trackers");
      }
    } catch {
      router.push("/my/trackers");
    } finally {
      setLoading(false);
    }
  }, [trackerId, router]);

  useEffect(() => {
    fetchTracker();
  }, [fetchTracker]);

  useEffect(() => {
    if (tracker) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
      const snippetCode = `<script>
(function(){
  const TRACKER_ID = "${tracker.trackerId}";
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
      setSnippet(snippetCode);
    }
  }, [tracker]);

  const fetchTracker = async () => {
    try {
      const res = await fetch(`/api/trackers/${trackerId}`);
      if (res.ok) {
        const data = await res.json();
        setTracker(data);
      } else {
        router.push("/my/trackers");
      }
    } catch (err) {
      console.error("Failed to fetch tracker:", err);
      router.push("/my/trackers");
    } finally {
      setLoading(false);
    }
  };

  const handleCopySnippet = async () => {
    await navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

  if (!tracker) {
    return null;
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push("/my/trackers")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{tracker.name}</h1>
            <p className="text-gray-600 mt-1">Detalhes e configuração do tracker</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-2xl">{tracker.name}</CardTitle>
                <CardDescription className="mt-2 font-mono text-sm">{tracker.trackerId}</CardDescription>
                <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                  <ExternalLink className="h-4 w-4" />
                  {tracker.siteUrl}
                </div>
              </div>
              <span
                className={`px-3 py-1 text-sm rounded-full font-medium ${
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
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Origens Permitidas</h3>
                {tracker.origins && tracker.origins.length > 0 ? (
                  <div className="space-y-2">
                    {tracker.origins.map((origin: string, idx: number) => (
                      <div key={idx} className="text-sm text-gray-700 bg-gray-50 p-3 rounded border">
                        <code className="font-mono">{origin}</code>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Nenhuma origem configurada</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Snippet de Tracking</CardTitle>
                <CardDescription>Cole este snippet no seu site para começar a rastrear</CardDescription>
              </div>
              <Button onClick={handleCopySnippet} variant={copied ? "default" : "outline"}>
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar Snippet
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
              <pre className="text-xs sm:text-sm whitespace-pre-wrap font-mono">{snippet}</pre>
            </div>
            <div className="mt-4 space-y-2 text-sm text-gray-600 bg-blue-50 p-4 rounded-lg">
              <p>
                <strong className="text-gray-900">WordPress Elementor:</strong> Vá em Elementor Pro → Custom
                Code → Body End e cole este snippet.
              </p>
              <p>
                <strong className="text-gray-900">HTML:</strong> Cole este snippet antes da tag de fechamento{" "}
                <code className="bg-gray-200 px-1 rounded">&lt;/body&gt;</code>.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
