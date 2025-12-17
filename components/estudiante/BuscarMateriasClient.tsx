"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  MagnifyingGlassIcon,
  ChevronRightIcon,
  CalendarDaysIcon,
} from "@heroicons/react/24/outline";
import UserMenu from "@/components/UserMenu";

export type MateriaItem = {
  id: number;
  nombre: string;
  semestres: string;
};

type ApiResp = {
  materias: MateriaItem[];
};

interface BuscarMateriasClientProps {
  initialMaterias?: MateriaItem[];
}

export default function BuscarMateriasClient({
  initialMaterias = [],
}: BuscarMateriasClientProps) {
  const router = useRouter();

  const [materias, setMaterias] = useState<MateriaItem[]>(initialMaterias);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(initialMaterias.length === 0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialMaterias.length > 0) {
      setLoading(false);
      return;
    }

    const fetchMaterias = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch("/api/estudiante/materias");
        const data = (await res.json()) as ApiResp;

        if (!res.ok) {
          throw new Error((data as any)?.message || "Error al cargar materias.");
        }

        setMaterias(data.materias || []);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Ocurrió un error al cargar las materias.");
      } finally {
        setLoading(false);
      }
    };

    fetchMaterias();
  }, [initialMaterias.length]);

  const materiasFiltradas = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return materias;

    return materias.filter((m) => {
      const texto = `${m.nombre} ${m.semestres}`.toLowerCase();
      return texto.includes(q);
    });
  }, [search, materias]);

  const handleClickMateria = (materiaId: number) => {
    router.push(`/estudiante/buscar-tutores/${materiaId}`);
  };

  const goMisSesiones = () => {
    router.push("/estudiante/sesiones");
  };

  return (
    <div className="flex-1 bg-white">
      <main className="mx-auto flex max-w-5xl flex-col px-4 py-8 sm:px-8 lg:py-10">
        {/* HEADER + ACCIONES DERECHA */}
        <header className="mb-6 flex items-start justify-between gap-4">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-[11px] font-medium text-blue-700">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-blue-500" />
              Módulo estudiante · Buscar tutorías
            </div>

            <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">
              Busca tutorías por materia
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Filtra por nombre de materia o semestre y selecciona una tarjeta
              para ver los tutores disponibles.
            </p>
          </div>

          {/* Acciones derecha (desktop) */}
          <div className="hidden sm:flex items-center gap-3">
            <button
              type="button"
              onClick={goMisSesiones}
              className="
                inline-flex items-center gap-2 rounded-full
                border-2 border-blue-200 bg-white
                px-4 py-2 text-sm font-semibold text-blue-700
                shadow-[0_10px_28px_rgba(37,99,235,0.12)]
                transition hover:-translate-y-[1px]
                hover:bg-blue-600 hover:text-white hover:border-blue-600
              "
            >
              <CalendarDaysIcon className="h-5 w-5" />
              Mis sesiones
            </button>

            <UserMenu />
          </div>
        </header>

        {/* Acciones (mobile) */}
        <div className="sm:hidden mb-6 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={goMisSesiones}
            className="
              inline-flex flex-1 items-center justify-center gap-2 rounded-full
              border-2 border-blue-200 bg-white
              px-4 py-2 text-sm font-semibold text-blue-700
              shadow-[0_10px_28px_rgba(37,99,235,0.12)]
              transition active:scale-[0.99]
            "
          >
            <CalendarDaysIcon className="h-5 w-5" />
            Mis sesiones
          </button>

          <UserMenu />
        </div>

        {/* Buscador + info */}
        <section className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-md">
            <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center">
              <MagnifyingGlassIcon className="h-5 w-5 text-slate-400" />
            </span>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Busca por nombre de materia o semestre..."
              className="w-full rounded-full border border-slate-200 bg-white py-2.5 pl-11 pr-4 text-sm text-slate-900 placeholder-slate-400 shadow-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="text-xs text-slate-500 sm:text-right">
            {loading ? (
              <span className="inline-flex items-center rounded-full bg-slate-50 px-3 py-1">
                Cargando materias…
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-slate-50 px-3 py-1">
                {materiasFiltradas.length} materia
                {materiasFiltradas.length === 1 ? "" : "s"} encontrada
                {materiasFiltradas.length === 1 ? "" : "s"}
              </span>
            )}
          </div>
        </section>

        {error && (
          <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-xs text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && (
          <section className="space-y-3">
            {materiasFiltradas.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-xs text-slate-500">
                No se encontraron materias con ese criterio de búsqueda.
              </div>
            ) : (
              materiasFiltradas.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => handleClickMateria(m.id)}
                  className="
                    group
                    flex w-full items-center justify-between
                    rounded-2xl
                    border-[2px] border-blue-200
                    bg-white
                    px-5 py-4
                    text-left
                    shadow-[0_12px_30px_rgba(37,99,235,0.10)]
                    transition-all
                    hover:-translate-y-[2px]
                    hover:border-blue-300
                    hover:shadow-[0_22px_55px_rgba(37,99,235,0.18)]
                    focus:outline-none
                    focus:ring-2
                    focus:ring-blue-100
                  "
                >
                  <div className="pr-4">
                    <p className="text-sm font-semibold text-slate-900">
                      {m.nombre}
                    </p>
                    {m.semestres && (
                      <span
                        className="
                          mt-1 inline-flex items-center gap-1
                          rounded-full border border-blue-200
                          bg-blue-50 px-3 py-0.5
                          text-[11px] font-medium text-blue-700
                        "
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                        Semestres: {m.semestres}
                      </span>
                    )}
                  </div>

                  <div
                    className="
                      flex h-10 w-10 items-center justify-center
                      rounded-full border border-blue-200
                      bg-blue-50
                      text-blue-600
                      shadow-sm
                      transition-all
                      group-hover:bg-blue-600
                      group-hover:text-white
                      group-hover:border-blue-600
                      group-hover:shadow-md
                    "
                  >
                    <ChevronRightIcon
                      className="
                        h-4 w-4
                        transform
                        transition-transform
                        group-hover:translate-x-[2px]
                      "
                    />
                  </div>
                </button>
              ))
            )}
          </section>
        )}

        {loading && !error && (
          <div className="mt-10 flex justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          </div>
        )}
      </main>
    </div>
  );
}
