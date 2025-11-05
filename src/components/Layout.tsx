"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LogOut, LayoutDashboard, BarChart3, Users, Settings, Shield } from "lucide-react";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      } else {
        router.push("/login");
      }
    } catch {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  const isAdmin = user?.role === "super_admin";
  const isAdminRoute = pathname?.startsWith("/admin");

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link href={isAdmin ? "/admin" : "/dashboard"} className="text-xl font-bold text-indigo-600">
                  Crivus QuizIQ
                </Link>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-1">
                {!isAdminRoute && (
                  <>
                    <NavLink href="/dashboard" icon={LayoutDashboard} label="Dashboard" pathname={pathname} />
                    <NavLink href="/my/trackers" icon={BarChart3} label="Meus Trackers" pathname={pathname} />
                  </>
                )}
                {isAdmin && (
                  <>
                    <NavLink href="/admin" icon={Shield} label="Admin" pathname={pathname} />
                    <NavLink href="/admin/users" icon={Users} label="Usuários" pathname={pathname} />
                    <NavLink href="/admin/policies" icon={Settings} label="Políticas" pathname={pathname} />
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700 hidden sm:inline">{user?.email}</span>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="text-gray-600">
                <LogOut className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Sair</span>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <div className="sm:hidden bg-white border-b">
        <div className="px-2 pt-2 pb-3 space-y-1">
          {!isAdminRoute && (
            <>
              <MobileNavLink href="/dashboard" label="Dashboard" pathname={pathname} />
              <MobileNavLink href="/my/trackers" label="Meus Trackers" pathname={pathname} />
            </>
          )}
          {isAdmin && (
            <>
              <MobileNavLink href="/admin" label="Admin" pathname={pathname} />
              <MobileNavLink href="/admin/users" label="Usuários" pathname={pathname} />
              <MobileNavLink href="/admin/policies" label="Políticas" pathname={pathname} />
            </>
          )}
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}

function NavLink({ href, icon: Icon, label, pathname }: { href: string; icon: any; label: string; pathname: string | null }) {
  const isActive = pathname === href || (href !== "/dashboard" && pathname?.startsWith(href));
  return (
    <Link
      href={href}
      className={`inline-flex items-center px-3 pt-1 border-b-2 text-sm font-medium transition-colors ${
        isActive
          ? "border-indigo-500 text-indigo-600"
          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
      }`}
    >
      <Icon className="h-4 w-4 mr-2" />
      {label}
    </Link>
  );
}

function MobileNavLink({ href, label, pathname }: { href: string; label: string; pathname: string | null }) {
  const isActive = pathname === href || (href !== "/dashboard" && pathname?.startsWith(href));
  return (
    <Link
      href={href}
      className={`block px-3 py-2 rounded-md text-base font-medium ${
        isActive ? "bg-indigo-50 text-indigo-600" : "text-gray-700 hover:bg-gray-50"
      }`}
    >
      {label}
    </Link>
  );
}

