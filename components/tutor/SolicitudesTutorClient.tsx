"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

type Solicitud = {
  id: number;
  estudianteId: number;
  materiaId: number;
  nombreEstudiante: string;
  cedulaEstudiante: string;
  comentario: string | null;
  estado: "PENDIENTE" | "ACEPTADA" | "RECHAZADA" | "CANCELADA";
  fechaSolicitud: string;
  materiaNombre: string;
};

type UsuarioLS = {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  rol: string;
};

export default function SolicitudesTutorClient() {
  const [usuario, setUsuario] = useState<UsuarioLS | null>(null);
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Leer usuario desde localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem("user");
      if (!raw) {
        setError("No se encontró información del usuario.");
        setLoading(false);
        return;
      }
      const u = JSON.parse(raw) as UsuarioLS;
      if (u.rol !== "TUTOR") {
        setError("Esta sección es solo para tutores.");
        setLoading(false);
        return;
      }
      setUsuario(u);
    } catch (e) {
      console.error(e);
      setError("Error al obtener el usuario.");
      setLoading(false);
    }
  }, []);

  // Cargar solicitudes cuando haya usuario
  useEffect(() => {
    const fetchData = async () => {
      if (!usuario) return;
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/tutor/solicitudes/${usuario.id}`);

        const isJson =
          res.headers.get("content-type")?.includes("application/json");
        const data = isJson ? await res.json() : null;

        if (!res.ok) {
          throw new Error(data?.message || "Error al obtener solicitudes.");
        }

        setSolicitudes((data.solicitudes || []) as Solicitud[]);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Ocurrió un error.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [usuario]);

  const estadoClasses: Record<Solicitud["estado"], string> = {
    PENDIENTE:
      "bg-rose-100 text-rose-800 border border-rose-200",
    ACEPTADA:
      "bg-emerald-100 text-emerald-800 border border-emerald-200",
    RECHAZADA:
      "bg-slate-100 text-slate-600 border border-slate-200",
    CANCELADA:
      "bg-slate-100 text-slate-600 border border-slate-200",
  };

  const solicitudesPendientes = useMemo(
    () => solicitudes.filter((s) => s.estado === "PENDIENTE"),
    [solicitudes]
  );

  const handleCambiarEstado = async (
    solicitud: Solicitud,
    nuevoEstado: "ACEPTADA" | "RECHAZADA"
  ) => {
    if (solicitud.estado === nuevoEstado) return;

    const textoConfirm =
      nuevoEstado === "ACEPTADA"
        ? "¿Aceptar esta solicitud de tutoría?"
        : "¿Rechazar esta solicitud de tutoría?";

    if (!confirm(textoConfirm)) return;

    try {
      setUpdatingId(solicitud.id);
      setError(null);

      const res = await fetch(`/api/tutor/solicitudes/${solicitud.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nuevoEstado,
          estudianteId: solicitud.estudianteId,
        }),
      });

      const isJson =
        res.headers.get("content-type")?.includes("application/json");
      const data = isJson ? await res.json() : null;

      if (!res.ok) {
        throw new Error(data?.message || "Error al actualizar solicitud.");
      }

      const actualizada = data?.solicitud as Solicitud;

      setSolicitudes((prev) =>
        prev.map((s) => (s.id === solicitud.id ? actualizada : s))
      );

      alert(
        nuevoEstado === "ACEPTADA"
          ? "Solicitud aceptada. El estudiante ha sido notificado."
          : "Solicitud rechazada. El estudiante ha sido notificado."
      );
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Ocurrió un error al actualizar.");
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading && !usuario) {
    return (
      <p className="text-xs text-slate-500 mt-4">
        Cargando información del tutor…
      </p>
    );
  }

  if (error && !usuario) {
    return (
      <p className="text-xs text-red-600 mt-4">
        {error}
      </p>
    );
  }

  return (
    <div className="space-y-3 mt-3">
      {error && (
        <p className="text-xs text-red-700 bg-red-50 border border-red-100 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      {solicitudes.length === 0 ? (
        <p className="text-xs text-slate-500">
          Aún no tienes solicitudes de tutoría.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {solicitudes.map((s) => {
            const fecha = new Date(s.fechaSolicitud);
            const fechaTexto = fecha.toLocaleString("es-EC", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
                <article
                key={s.id}
                className="
                    rounded-2xl
                    border-2 border-indigo-300
                    bg-white
                    shadow-[0_4px_14px_rgba(88,80,236,0.22)]
                    hover:shadow-[0_8px_24px_rgba(88,80,236,0.30)]
                    hover:border-indigo-500
                    transition-all
                    duration-300
                    p-5
                    flex flex-col
                    gap-2
                "
                >

                <header className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {s.nombreEstudiante}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Cédula:{" "}
                      <span className="text-slate-800">
                        {s.cedulaEstudiante}
                      </span>
                    </p>
                    <p className="text-[11px] text-indigo-700 mt-0.5">
                      Materia: {s.materiaNombre}
                    </p>
                  </div>

                  <span
                    className={
                      "inline-flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-semibold " +
                      estadoClasses[s.estado]
                    }
                  >
                    {s.estado === "PENDIENTE" && (
                      <ClockIcon className="h-3 w-3" />
                    )}
                    {s.estado === "ACEPTADA" && (
                      <CheckCircleIcon className="h-3 w-3" />
                    )}
                    {s.estado === "RECHAZADA" && (
                      <XCircleIcon className="h-3 w-3" />
                    )}
                    {s.estado}
                  </span>
                </header>

                <section className="text-[11px] text-slate-600 bg-slate-50/80 rounded-xl px-3 py-2">
                  <p className="font-semibold text-slate-700 mb-0.5">
                    Comentario del estudiante:
                  </p>
                  <p className="leading-snug">
                    {s.comentario && s.comentario.trim() !== ""
                      ? s.comentario
                      : "Sin comentario adicional."}
                  </p>
                </section>

                <p className="text-[10px] text-slate-400">
                  Enviada el {fechaTexto}
                </p>

                <footer className="mt-auto pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleCambiarEstado(s, "ACEPTADA")}
                    disabled={
                      updatingId === s.id || s.estado === "ACEPTADA"
                    }
                    className="
                      inline-flex items-center justify-center gap-1
                      rounded-full
                      bg-emerald-600
                      text-white
                      px-3 py-1.5
                      text-[11px] font-semibold
                      hover:bg-emerald-700
                      disabled:opacity-50 disabled:cursor-not-allowed
                    "
                  >
                    <CheckCircleIcon className="h-3 w-3" />
                    {updatingId === s.id && s.estado !== "ACEPTADA"
                      ? "Guardando…"
                      : "Aceptar"}
                  </button>

                    <button
                    type="button"
                    onClick={() => handleCambiarEstado(s, "RECHAZADA")}
                    disabled={
                        updatingId === s.id || s.estado === "RECHAZADA"
                    }
                    className="
                        inline-flex items-center justify-center gap-1
                        rounded-full
                        bg-red-600
                        text-white
                        px-3 py-1.5
                        text-[11px] font-semibold
                        hover:bg-red-700
                        disabled:opacity-50 disabled:cursor-not-allowed
                    "
                    >
                    <XCircleIcon className="h-3 w-3" />
                    Rechazar
                    </button>


                </footer>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
