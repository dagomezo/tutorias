"use client";

import { useEffect, useState } from "react";
import { UsersIcon, AcademicCapIcon, CalendarDaysIcon } from "@heroicons/react/24/outline";

type AdminDashboardStats = {
  totalEstudiantes: number;
  totalTutores: number;
  sesionesMes: number;
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cargar = async () => {
      try {
        const res = await fetch("/api/admin/dashboard");
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data?.message || "Error al cargar dashboard.");
        }

        setStats(data as AdminDashboardStats);
      } catch (err: any) {
        setError(err.message || "Ocurrió un error al cargar el dashboard.");
      } finally {
        setLoading(false);
      }
    };

    cargar();
  }, []);

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-sm font-semibold text-slate-900">
          Dashboard de administrador
        </h2>
        <p className="text-xs text-slate-500">
          Resumen general de usuarios y actividad del sistema de tutorías.
        </p>
      </header>

      {loading && (
        <p className="text-xs text-slate-500">Cargando información…</p>
      )}

      {error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      {stats && (
        <section className="grid gap-4 sm:grid-cols-3">
          {/* Tarjeta estudiantes */}
          <article className="rounded-2xl bg-white border border-slate-200 shadow-sm p-4 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                  Estudiantes
                </p>
                <p className="text-2xl font-semibold text-slate-900">
                  {stats.totalEstudiantes}
                </p>
              </div>
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <UsersIcon className="h-5 w-5" />
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Total de estudiantes registrados en el sistema.
            </p>
          </article>

          {/* Tarjeta tutores */}
          <article className="rounded-2xl bg-white border border-slate-200 shadow-sm p-4 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                  Tutores
                </p>
                <p className="text-2xl font-semibold text-slate-900">
                  {stats.totalTutores}
                </p>
              </div>
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <AcademicCapIcon className="h-5 w-5" />
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Tutores académicos activos en la plataforma.
            </p>
          </article>

          {/* Tarjeta sesiones del mes */}
          <article className="rounded-2xl bg-white border border-slate-200 shadow-sm p-4 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                  Sesiones este mes
                </p>
                <p className="text-2xl font-semibold text-slate-900">
                  {stats.sesionesMes}
                </p>
              </div>
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                <CalendarDaysIcon className="h-5 w-5" />
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Número de tutorías registradas en el mes actual.
            </p>
          </article>
        </section>
      )}
    </div>
  );
}
