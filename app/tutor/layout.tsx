import Link from "next/link";
import { ReactNode } from "react";
import { AcademicCapIcon } from "@heroicons/react/24/outline";
import UserMenu from "@/components/UserMenu";

export default function TutorLayout({ children }: { children: ReactNode }) {
  // TODO: reemplazar por datos reales del tutor logueado
  const nombre = "Juan";
  const apellido = "Pérez";
  const email = "juan.tutor@espe.edu.ec";

  const links = [
    { href: "/tutor/dashboard", label: "Dashboard" },
    { href: "/tutor/materias", label: "Mis materias" },
    { href: "/tutor/disponibilidad", label: "Mi disponibilidad" },
    { href: "/tutor/solicitudes", label: "Solicitudes" },
    { href: "/tutor/sesiones", label: "Mis sesiones" },
    { href: "/tutor/perfil", label: "Perfil" },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* HEADER PRINCIPAL */}
      <header className="border-b bg-white/80 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AcademicCapIcon className="h-7 w-7 text-indigo-600" />
            <div>
              <h1 className="text-lg font-semibold text-slate-900">
                Panel del tutor
              </h1>
              <p className="text-xs text-slate-500">
                Gestiona tus tutorías, disponibilidad y solicitudes.
              </p>
            </div>
          </div>

          <UserMenu
            nombre={nombre}
            apellido={apellido}
            email={email}
            imagen={null}
          />
        </div>

        {/* SUBMENÚ */}
        <nav className="border-t bg-white/80">
          <div className="mx-auto max-w-6xl px-4 flex gap-4 overflow-x-auto">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="py-3 text-sm text-slate-600 hover:text-indigo-600 border-b-2 border-transparent data-[active=true]:border-indigo-600 data-[active=true]:text-indigo-700"
                data-active={
                  typeof window === "undefined"
                    ? undefined
                    : window.location.pathname === link.href
                }
              >
                {link.label}
              </Link>
            ))}
          </div>
        </nav>
      </header>

      {/* CONTENIDO DE CADA PÁGINA */}
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
