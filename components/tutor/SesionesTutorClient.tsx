"use client";

import { useEffect, useState } from "react";

type Sesion = {
  id: number;
  estudianteId: number;
  estudianteNombre: string;
  estudianteApellido: string;
  materiaId: number;
  materiaNombre: string;
  fechaHoraInicio: string;
  fechaHoraFin: string;
  modalidad: "PRESENCIAL" | "VIRTUAL";
  estado: "PENDIENTE" | "ACEPTADA" | "RECHAZADA" | "COMPLETADA" | "CANCELADA";
  comentarioEstudiante: string | null;
  comentarioTutor: string | null;
  calificacion: number | null;
  costoTutoria: string | null;
  creadoEn: string;
};

type UsuarioLS = {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  rol: string;
};

type SesionesResponse = {
  proximas: Sesion[];
  historial: Sesion[];
};

export default function MisSesionesTutorClient() {
  const [usuario, setUsuario] = useState<UsuarioLS | null>(null);
  const [proximas, setProximas] = useState<Sesion[]>([]);
  const [historial, setHistorial] = useState<Sesion[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Leer usuario (tutor) desde localStorage
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

  // Traer sesiones cuando ya tenemos usuario
  useEffect(() => {
    const fetchData = async () => {
      if (!usuario) return;

          // ✅ valida id antes de llamar a la API
        if (!usuario.id || Number.isNaN(Number(usuario.id))) {
          setError("No se pudo obtener el ID del tutor desde la sesión. Vuelve a iniciar sesión.");
          setLoading(false);
          return;
        }
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/tutor/sesiones/${usuario.id}`);
        const data = (await res.json()) as SesionesResponse;

        if (!res.ok) {
          throw new Error(
            (data as any)?.message || "Error al obtener las sesiones."
          );
        }

        setProximas(data.proximas || []);
        setHistorial(data.historial || []);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Ocurrió un error al obtener sesiones.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [usuario]);

  const marcarComoCompletada = async (sesion: Sesion) => {
    const hoy = new Date();
    const fechaSesion = new Date(sesion.fechaHoraInicio);

    // Solo habilitado el mismo día
    const esMismoDia =
      hoy.getFullYear() === fechaSesion.getFullYear() &&
      hoy.getMonth() === fechaSesion.getMonth() &&
      hoy.getDate() === fechaSesion.getDate();

    if (!esMismoDia) {
      alert("Solo puedes marcar como completada el día de la sesión.");
      return;
    }

    if (!confirm("¿Marcar esta sesión como COMPLETADA?")) return;

    try {
      setUpdatingId(sesion.id);
      setError(null);

      const res = await fetch(`/api/tutor/sesiones/${sesion.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nuevoEstado: "COMPLETADA" }),
      });

      const isJson = res.headers.get("content-type")?.includes("application/json");
      const data = isJson ? await res.json() : null;

      if (!res.ok) throw new Error(data?.message || "Error al obtener las sesiones.");
      

      if (!res.ok) {
        throw new Error(data?.message || "Error al actualizar la sesión.");
      }

      const sesionAct = data.sesion as Sesion;

      setProximas((prev) => prev.filter((s) => s.id !== sesion.id));
      setHistorial((prev) => [...prev, sesionAct]);

      // Link de calificación (ejemplo sencillo)
      const linkCalificacion = `${window.location.origin}/calificar-sesion/${sesion.id}`;
      alert(
        `Sesión completada.\nEnvía este link al estudiante para que califique la sesión:\n\n${linkCalificacion}`
      );
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Ocurrió un error al actualizar la sesión.");
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading && !usuario) {
    return (
      <p className="mt-4 text-xs text-slate-500">
        Cargando información del tutor…
      </p>
    );
  }

  if (error && !usuario) {
    return (
      <p className="mt-4 text-xs text-red-600">
        {error}
      </p>
    );
  }

  return (
    <div className="space-y-6 mt-4">
      {error && (
        <p className="text-xs text-red-700 bg-red-50 border border-red-100 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      {/* Próximas sesiones */}
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5">
        <h2 className="text-sm font-semibold text-slate-900 mb-2">
          Próximas sesiones
        </h2>

        {proximas.length === 0 ? (
          <p className="text-xs text-slate-500">
            No tienes sesiones próximas.
          </p>
        ) : (
          <div className="space-y-3">
            {proximas.map((s) => {
              const inicio = new Date(s.fechaHoraInicio);
              const fin = new Date(s.fechaHoraFin);

              const textoFecha = inicio.toLocaleDateString("es-EC", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              });

              const rangoHora = `${inicio.toLocaleTimeString("es-EC", {
                hour: "2-digit",
                minute: "2-digit",
              })} - ${fin.toLocaleTimeString("es-EC", {
                hour: "2-digit",
                minute: "2-digit",
              })}`;

              const hoy = new Date();
              const esMismoDia =
                hoy.getFullYear() === inicio.getFullYear() &&
                hoy.getMonth() === inicio.getMonth() &&
                hoy.getDate() === inicio.getDate();

              return (
                <article
                  key={s.id}
                  className="border-[2px] border-indigo-200 bg-indigo-50/40 rounded-2xl px-4 py-3 shadow-sm hover:shadow-md hover:border-indigo-400 transition-all duration-200"
                >
                  <p className="text-xs font-semibold text-slate-900">
                    {s.materiaNombre} · {s.modalidad === "VIRTUAL" ? "Virtual" : "Presencial"}
                  </p>
                  <p className="text-[11px] text-slate-600">
                    Estudiante: {s.estudianteNombre} {s.estudianteApellido}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {textoFecha} · {rangoHora}
                  </p>

                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-[10px] rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">
                      Estado: {s.estado}
                    </span>

                    <button
                      type="button"
                      disabled={updatingId === s.id || !esMismoDia}
                      onClick={() => marcarComoCompletada(s)}
                      className="
                        text-[11px] font-semibold
                        rounded-full
                        px-3 py-1.5
                        bg-emerald-600 text-white
                        hover:bg-emerald-700
                        disabled:opacity-50 disabled:cursor-not-allowed
                      "
                    >
                      {updatingId === s.id
                        ? "Guardando…"
                        : "Sesión completada"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Historial */}
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5">
        <h2 className="text-sm font-semibold text-slate-900 mb-2">
          Historial de sesiones
        </h2>

        {historial.length === 0 ? (
          <p className="text-xs text-slate-500">
            Aún no tienes historial de sesiones.
          </p>
        ) : (
          <div className="space-y-3">
            {historial.map((s) => {
              const inicio = new Date(s.fechaHoraInicio);
              const textoFecha = inicio.toLocaleDateString("es-EC", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              });

              return (
                <article
                  key={s.id}
                  className="border-2 border-slate-300 rounded-2xl px-4 py-3 bg-slate-50/60 shadow-sm"
                >
                  <p className="text-xs font-semibold text-slate-900">
                    {s.materiaNombre}
                  </p>
                  <p className="text-[11px] text-slate-600">
                    Estudiante: {s.estudianteNombre} {s.estudianteApellido}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Fecha: {textoFecha} · Estado: {s.estado}
                  </p>

                  {s.calificacion != null && (
                    <p className="text-[11px] text-emerald-700 mt-1">
                      Calificación del estudiante:{" "}
                      <span className="font-semibold">{s.calificacion}/10</span>
                    </p>
                  )}

                  {s.comentarioEstudiante && (
                    <p className="text-[11px] text-slate-600 mt-1">
                      Comentario: {s.comentarioEstudiante}
                    </p>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
