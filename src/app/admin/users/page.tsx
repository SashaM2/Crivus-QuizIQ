"use client";

import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, Shield, User } from "lucide-react";

interface User {
  id: string;
  email: string;
  role: string;
  createdAt: string;
  lastLoginAt: string | null;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteCode, setInviteCode] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      // TODO: Criar endpoint /api/admin/users
      // Por enquanto, usaremos uma abordagem diferente
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch users:", err);
      setLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/auth/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, role: "friend" }),
      });
      if (res.ok) {
        const data = await res.json();
        setInviteCode(data.code);
        setInviteEmail("");
        alert(`Convite criado! Código: ${data.code}`);
      }
    } catch (err) {
      console.error("Failed to create invite:", err);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Usuários</h1>
            <p className="text-gray-600 mt-1">Gerencie usuários e convites</p>
          </div>
          <Button onClick={() => setShowInvite(!showInvite)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Criar Convite
          </Button>
        </div>

        {showInvite && (
          <Card>
            <CardHeader>
              <CardTitle>Criar Convite</CardTitle>
              <CardDescription>Convide um novo usuário friend</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleInvite} className="space-y-4">
                <div>
                  <Label htmlFor="invite-email">Email</Label>
                  <Input
                    id="invite-email"
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="usuario@example.com"
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit">Criar Convite</Button>
                  <Button type="button" variant="outline" onClick={() => setShowInvite(false)}>
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Usuários do Sistema</CardTitle>
            <CardDescription>Lista de todos os usuários cadastrados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-gray-500">
              <p>Funcionalidade de listagem de usuários será implementada em breve</p>
              <p className="text-sm mt-2">Use o endpoint /api/auth/invite para criar convites</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

