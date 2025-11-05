"use client";

import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminModerationPage() {
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Moderação</h1>
          <p className="text-gray-600 mt-1">Pausar e revogar trackers</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Moderação de Trackers</CardTitle>
            <CardDescription>Gerencie e modere trackers do sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-gray-500">
              <p>Funcionalidade de moderação será implementada em breve</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

