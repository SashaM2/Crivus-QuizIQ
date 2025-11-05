"use client";

import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminAuditPage() {
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Auditoria</h1>
          <p className="text-gray-600 mt-1">Logs de autenticação e atividades do sistema</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Logs de Autenticação</CardTitle>
            <CardDescription>Registro de tentativas de login e atividades</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-gray-500">
              <p>Funcionalidade de auditoria será implementada em breve</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

