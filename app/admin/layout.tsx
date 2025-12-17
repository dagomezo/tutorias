"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AcademicCapIcon } from "@heroicons/react/24/outline";
import UserMenu from "@/components/UserMenu";

type User = {
  id: number;
  nombre?: string;
  apellido?: string;
  email?: string;
  rol: string;
  imagen_perfil?: string | null;
};

const adminLinks = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/estudiantes", label: "Estudiantes" },
  { href: "/admin/tutores", label: "Tutores" },
  { href: "/admin/materias", label: "Materias" },
  { href: "/admin/reportes", label: "Reportes" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const raw = localStorage.getItem("user");
      if (!raw) {
        router.replace("/login");
        return;
      }

      const u = JSON.parse(raw) as User;

      if (u.rol !== "ADMIN") {
        router.replace("/login");
        return;
      }

      setUser(u);
    } catch (err) {
      console.error("Error leyendo usuario de localStorage", err);
      router.replace("/login");
    } finally {
      setChecking(false);
    }
  }, [router]);

  if (checking || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-500">
          Cargando panel de administrador…
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* CABECERA */}
      <header className="border-b bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          {/* Logo + título */}
          <div className="flex items-center gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white">
              <AcademicCapIcon className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-sm font-semibold text-slate-900">
                Panel de administrador
              </h1>
              <p className="text-xs text-slate-500">
                Gestiona usuarios, materias y reportes del sistema.
              </p>
            </div>
          </div>

          {/* Menú de usuario */}
          <UserMenu
            nombre={user.nombre}
            apellido={user.apellido}
            email={user.email}
            imagen={user.imagen_perfil ?? null}
          />
        </div>

        {/* NAV */}
        <nav className="border-t border-slate-100">
          <div className="mx-auto max-w-6xl px-4 flex gap-4 overflow-x-auto py-2 text-xs">
            {adminLinks.map((link) => {
              const active = pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`whitespace-nowrap border-b-2 px-1.5 pb-1 ${
                    active
                      ? "border-indigo-600 text-indigo-700 font-medium"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </nav>
      </header>

      {/* CONTENIDO */}
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
