"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronRightIcon,
  MagnifyingGlassIcon,
  StarIcon,
} from "@heroicons/react/24/outline";
import UserMenu from "@/components/UserMenu";

export type MateriaDetalle = {
  id: number;
  nombre: string;
};

export type TutorItem = {
  id: number;
  nombre: string;
  apellido: string;
  carrera: string;
  imagen_perfil: string | null;
  modalidad_presencial: boolean;
  modalidad_virtual: boolean;
  calificacion_promedio: number | null;
};

interface TutoresMateriaClientProps {
  materia: MateriaDetalle | null;
  initialTutores: TutorItem[];
}

export default function TutoresMateriaClient({
  materia,
  initialTutores,
}: TutoresMateriaClientProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [tutores] = useState<TutorItem[]>(initialTutores);

  const filtrados = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return tutores;

    return tutores.filter((t) => {
      const text = `${t.nombre} ${t.apellido} ${t.carrera}`.toLowerCase();
      return text.includes(q);
    });
  }, [search, tutores]);

  const handleVerHorarios = (tutorId: number) => {
    if (!materia) return;
    router.push(`/estudiante/buscar-tutores/${materia.id}/tutor/${tutorId}`);
  };

  return (
    <div className="min-h-screen w-full bg-white">
      <main className="mx-auto flex max-w-6xl flex-col px-4 py-8 sm:px-8 lg:py-10">
        {/* HEADER + USER MENU */}
        <header className="mb-6 flex w-full items-start justify-between gap-4">
          <div className="flex-1">
            {/* Breadcrumb */}
            <nav className="mb-2 text-xs text-slate-400">
              <button
                type="button"
                onClick={() => router.push("/estudiante/buscar-tutores")}
                className="text-slate-500 hover:text-indigo-600"
              >
                Materias
              </button>
              <span className="mx-1">›</span>
              <span className="text-slate-700">
                {materia?.nombre ?? "Materia"}
              </span>
              <span className="mx-1">›</span>
              <span className="text-indigo-600 font-medium">Tutores</span>
            </nav>

            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-[11px] font-medium text-blue-700">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-blue-500" />
              Tutores disponibles ·{" "}
              <span className="font-semibold">
                {materia?.nombre ?? "Materia"}
              </span>
            </div>

            <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">
              Tutores disponibles para{" "}
              <span className="text-indigo-600">
                {materia?.nombre ?? "esta materia"}
              </span>
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Explora los tutores que dictan esta materia. Revisa su carrera y
              calificación promedio, luego selecciona{" "}
              <strong>“Ver horarios”</strong> para solicitar una tutoría.
            </p>
          </div>

          <div className="ml-4 shrink-0">
            <UserMenu />
          </div>
        </header>

        {/* Buscador + contador */}
        <section className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-md">
            <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center">
              <MagnifyingGlassIcon className="h-5 w-5 text-slate-400" />
            </span>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Busca por nombre de tutor o carrera..."
              className="w-full rounded-full border border-slate-200 bg-white py-2.5 pl-11 pr-4 text-sm text-slate-900 placeholder-slate-400 shadow-sm transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          <div className="text-xs text-slate-500 sm:text-right">
            <span className="inline-flex items-center rounded-full bg-slate-50 px-3 py-1">
              {filtrados.length} tutor
              {filtrados.length === 1 ? "" : "es"} encontrado
              {filtrados.length === 1 ? "" : "s"}
            </span>
          </div>
        </section>

        {/* Lista de tutores */}
        {filtrados.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
            No se encontraron tutores para esta materia.
          </div>
        ) : (
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtrados.map((t) => {
              const nombreCompleto = `${t.nombre} ${t.apellido}`;
              const calificacion =
                t.calificacion_promedio != null
                  ? t.calificacion_promedio.toFixed(1)
                  : null;
              const iniciales = `${t.nombre[0] ?? ""}${
                t.apellido[0] ?? ""
              }`.toUpperCase();

              return (
                <article
                  key={t.id}
                  className="
                    group flex flex-col justify-between
                    rounded-2xl border-2 border-indigo-100
                    bg-white
                    px-4 py-4
                    shadow-[0_12px_30px_rgba(15,23,42,0.06)]
                    transition-all
                    hover:-translate-y-1
                    hover:border-indigo-400
                    hover:shadow-[0_20px_45px_rgba(79,70,229,0.25)]
                  "
                >
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className="relative h-11 w-11 shrink-0">
                      <div className="h-11 w-11 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-semibold overflow-hidden">
                        {t.imagen_perfil ? (
                          <img
                            src={t.imagen_perfil}
                            alt={nombreCompleto}
                            className="h-11 w-11 rounded-full object-cover"
                          />
                        ) : (
                          iniciales || "?"
                        )}
                      </div>
                    </div>

                    <div className="flex-1">
                      <h2 className="text-sm font-semibold text-slate-900">
                        {nombreCompleto}
                      </h2>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {t.carrera}
                      </p>

                      {/* Calificación */}
                      <div className="mt-3 flex items-center gap-1 text-xs text-slate-500">
                        <StarIcon className="h-4 w-4 text-amber-400" />
                        {calificacion ? (
                          <span>{calificacion} · Calificación promedio</span>
                        ) : (
                          <span>Sin calificaciones aún</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Botón Ver horarios */}
                  <div className="mt-4 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => handleVerHorarios(t.id)}
                      className="
                        inline-flex items-center justify-center gap-1.5
                        rounded-full
                        bg-indigo-600
                        px-3.5 py-1.5
                        text-xs font-medium text-white
                        shadow-sm
                        transition-all
                        hover:bg-indigo-700
                        hover:shadow-md
                        focus:outline-none
                        focus:ring-2
                        focus:ring-indigo-200
                        group-hover:-translate-y-0.5
                      "
                    >
                      Ver horarios
                      <ChevronRightIcon className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </main>
    </div>
  );
}
