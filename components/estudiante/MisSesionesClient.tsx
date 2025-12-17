"use client";

import { useEffect, useMemo, useState } from "react";
import UserMenu from "@/components/UserMenu";
import {
  CalendarDaysIcon,
  ClockIcon,
  XMarkIcon,
  StarIcon,
  VideoCameraIcon,
} from "@heroicons/react/24/outline";

type SesionItem = {
  id: number;
  fecha_hora_inicio: string;
  fecha_hora_fin: string;
  modalidad: "PRESENCIAL" | "VIRTUAL";
  estado: "PENDIENTE" | "ACEPTADA" | "RECHAZADA" | "COMPLETADA" | "CANCELADA";
  comentario_estudiante: string | null;
  calificacion: number | null;

  tutor_nombre: string;
  tutor_apellido: string;
  tutor_carrera: string | null;
  tutor_link_zoom: string | null;

  materia_nombre: string;
};

type UsuarioLS = {
  id?: number;
  nombre?: string;
  apellido?: string;
  email?: string;
  rol?: string;
  imagen_perfil?: string | null;
};

export default function MisSesionesClient() {
  const [user, setUser] = useState<UsuarioLS | null>(null);

  const [sesiones, setSesiones] = useState<SesionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [tab, setTab] = useState<"FUTURAS" | "HISTORIAL">("FUTURAS");

  // Modal calificar
  const [openRate, setOpenRate] = useState(false);
  const [rateSesion, setRateSesion] = useState<SesionItem | null>(null);
  const [calificacion, setCalificacion] = useState(8);
  const [comentario, setComentario] = useState("");
  const [saving, setSaving] = useState(false);

  // Toast simple
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("user");
      if (!raw) return;
      const parsed = JSON.parse(raw) as UsuarioLS;
      setUser(parsed);
    } catch {}
  }, []);

  const estudianteId = user?.id;

  const fetchSesiones = async () => {
    if (!estudianteId) {
      setLoading(false);
      setError("No se encontró la sesión del estudiante. Vuelve a iniciar sesión.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`/api/estudiante/sesiones?estudianteId=${estudianteId}`, {
        cache: "no-store",
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) throw new Error(data?.message || "Error al cargar sesiones.");

      setSesiones((data?.sesiones || []) as SesionItem[]);
    } catch (e: any) {
      setError(e.message || "Error al cargar sesiones.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSesiones();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estudianteId]);

  const futuras = useMemo(
    () => sesiones.filter((s) => s.estado === "PENDIENTE" || s.estado === "ACEPTADA"),
    [sesiones]
  );

  const historial = useMemo(
    () => sesiones.filter((s) => s.estado === "COMPLETADA" || s.estado === "CANCELADA"),
    [sesiones]
  );

  const list = tab === "FUTURAS" ? futuras : historial;

  const fmtFecha = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString("es-EC", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const fmtHora = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit" });
  };

  const minutesToStart = (iso: string) => {
    const ms = new Date(iso).getTime() - Date.now();
    return Math.floor(ms / 60000);
  };

  const canCancel = (s: SesionItem) =>
    (s.estado === "PENDIENTE" || s.estado === "ACEPTADA") && minutesToStart(s.fecha_hora_inicio) >= 30;

  const cancelSesion = async (sesionId: number) => {
    if (!estudianteId) return;

    try {
      const res = await fetch(`/api/estudiante/sesiones/${sesionId}/cancel`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estudianteId }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) throw new Error(data?.message || "No se pudo cancelar.");

      setToast("Sesión cancelada ✅");
      await fetchSesiones();
    } catch (e: any) {
      setToast(e.message || "Error al cancelar.");
    } finally {
      setTimeout(() => setToast(null), 2500);
    }
  };

  const openCalificar = (s: SesionItem) => {
    setRateSesion(s);
    setCalificacion(8);
    setComentario("");
    setOpenRate(true);
  };

  const guardarCalificacion = async () => {
    if (!rateSesion || !estudianteId) return;

    try {
      setSaving(true);

      const res = await fetch(`/api/estudiante/sesiones/${rateSesion.id}/calificar`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          estudianteId,
          calificacion,
          comentario,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) throw new Error(data?.message || "No se pudo guardar la calificación.");

      setOpenRate(false);
      setToast("Calificación enviada ⭐");
      await fetchSesiones();
    } catch (e: any) {
      setToast(e.message || "Error al calificar.");
    } finally {
      setSaving(false);
      setTimeout(() => setToast(null), 2500);
    }
  };

  return (
    <div className="min-h-[calc(100vh-0px)] bg-white">
      {/* Header superior con UserMenu */}
      <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-[11px] font-medium text-blue-700">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-blue-500" />
              Módulo estudiante · Mis sesiones
            </div>

            <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">
              Mis sesiones
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Aquí puedes ver tus próximas tutorías, tu historial y calificar sesiones completadas.
            </p>
          </div>

          <div className="shrink-0">
            <UserMenu />
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-6 flex w-full max-w-xl items-center gap-2 rounded-2xl border-2 border-blue-100 bg-blue-50/40 p-1">
          <button
            onClick={() => setTab("FUTURAS")}
            className={`flex-1 rounded-2xl px-4 py-2 text-sm font-semibold transition ${
              tab === "FUTURAS"
                ? "bg-white text-blue-700 shadow-sm border border-blue-100"
                : "text-slate-600 hover:text-blue-700"
            }`}
          >
            Próximas
          </button>
          <button
            onClick={() => setTab("HISTORIAL")}
            className={`flex-1 rounded-2xl px-4 py-2 text-sm font-semibold transition ${
              tab === "HISTORIAL"
                ? "bg-white text-blue-700 shadow-sm border border-blue-100"
                : "text-slate-600 hover:text-blue-700"
            }`}
          >
            Historial
          </button>
        </div>

        {/* Estado */}
        {loading && (
          <div className="mt-8 flex items-center gap-3 text-sm text-slate-500">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
            Cargando sesiones…
          </div>
        )}

        {error && (
          <div className="mt-6 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Lista */}
        {!loading && !error && (
          <div className="mt-6 grid grid-cols-1 gap-4 pb-10 lg:grid-cols-2">
            {list.length === 0 ? (
              <div className="rounded-2xl border-2 border-blue-100 bg-blue-50/30 px-4 py-10 text-center text-sm text-slate-500 lg:col-span-2">
                No tienes sesiones en esta sección.
              </div>
            ) : (
              list.map((s) => {
                const tutorFull = `${s.tutor_nombre} ${s.tutor_apellido}`.trim();
                const esVirtual = s.modalidad === "VIRTUAL";
                const cancelable = canCancel(s);
                const yaCalificada = s.calificacion !== null;

                return (
                  <div
                    key={s.id}
                    className="
                      rounded-2xl border-2 border-blue-200 bg-white
                      shadow-[0_18px_45px_rgba(37,99,235,0.12)]
                      transition-all hover:-translate-y-[2px]
                      hover:shadow-[0_28px_70px_rgba(37,99,235,0.18)]
                    "
                  >
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-bold text-slate-900">{s.materia_nombre}</p>
                          <p className="mt-1 text-sm text-slate-600">{tutorFull}</p>
                          {s.tutor_carrera && (
                            <p className="mt-0.5 text-xs text-slate-500">{s.tutor_carrera}</p>
                          )}
                        </div>

                        <span
                          className={`
                            inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold
                            ${s.estado === "ACEPTADA" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : ""}
                            ${s.estado === "PENDIENTE" ? "border-amber-200 bg-amber-50 text-amber-700" : ""}
                            ${s.estado === "COMPLETADA" ? "border-slate-200 bg-slate-50 text-slate-700" : ""}
                            ${s.estado === "CANCELADA" ? "border-red-200 bg-red-50 text-red-700" : ""}
                          `}
                        >
                          {s.estado}
                        </span>
                      </div>

                      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <CalendarDaysIcon className="h-4 w-4 text-blue-600" />
                          {fmtFecha(s.fecha_hora_inicio)}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <ClockIcon className="h-4 w-4 text-blue-600" />
                          {fmtHora(s.fecha_hora_inicio)} – {fmtHora(s.fecha_hora_fin)}
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[11px] font-semibold text-blue-700">
                          Modalidad: {s.modalidad}
                        </span>

                        {esVirtual && s.tutor_link_zoom && (
                          <a
                            href={s.tutor_link_zoom}
                            target="_blank"
                            rel="noreferrer"
                            className="
                              inline-flex items-center gap-2 rounded-full
                              border border-blue-200 bg-white px-3 py-1 text-[11px]
                              font-semibold text-blue-700 shadow-sm
                              transition hover:bg-blue-600 hover:text-white hover:border-blue-600
                            "
                          >
                            <VideoCameraIcon className="h-4 w-4" />
                            Abrir Zoom
                          </a>
                        )}
                      </div>

                      {/* acciones */}
                      <div className="mt-5 flex flex-wrap gap-2">
                        {/* Calificar solo en COMPLETADA y no calificada */}
                        {s.estado === "COMPLETADA" && !yaCalificada && (
                          <button
                            onClick={() => openCalificar(s)}
                            className="
                              group inline-flex items-center gap-2 rounded-full
                              bg-blue-600 px-4 py-2 text-sm font-semibold text-white
                              shadow-md transition hover:bg-blue-700 hover:-translate-y-[1px]
                            "
                          >
                            <StarIcon className="h-5 w-5 transition group-hover:rotate-6" />
                            Calificar sesión
                          </button>
                        )}

                        {s.estado === "COMPLETADA" && yaCalificada && (
                          <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
                            ⭐ Calificada: {s.calificacion}/10
                          </span>
                        )}

                        {/* Cancelar futura */}
                        {(s.estado === "PENDIENTE" || s.estado === "ACEPTADA") && (
                          <button
                            onClick={() => cancelSesion(s.id)}
                            disabled={!cancelable}
                            className={`
                              inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold
                              transition
                              ${
                                cancelable
                                  ? "border border-red-200 bg-white text-red-700 hover:bg-red-600 hover:text-white hover:border-red-600 shadow-sm"
                                  : "border border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed"
                              }
                            `}
                            title={
                              cancelable
                                ? "Cancelar sesión"
                                : "Solo se puede cancelar hasta 30 min antes"
                            }
                          >
                            <XMarkIcon className="h-5 w-5" />
                            Cancelar
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* MODAL CALIFICAR */}
      {openRate && rateSesion && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center px-4">
          {/* overlay */}
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm anim-fadeIn"
            onClick={() => setOpenRate(false)}
          />
          {/* modal */}
          <div className="relative w-full max-w-lg rounded-2xl border-2 border-blue-200 bg-white p-5 shadow-2xl anim-popIn">

            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Calificar tutoría
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {rateSesion.materia_nombre} · {rateSesion.tutor_nombre}{" "}
                  {rateSesion.tutor_apellido}
                </p>
              </div>

              <button
                onClick={() => setOpenRate(false)}
                className="rounded-full border border-slate-200 bg-white p-2 text-slate-600 shadow-sm hover:bg-slate-50"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            {/* rating */}
            <div className="mt-5 rounded-2xl border-2 border-blue-100 bg-blue-50/30 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-800">
                  Calificación: <span className="text-blue-700">{calificacion}</span>/10
                </p>
              </div>

              <input
                type="range"
                min={1}
                max={10}
                value={calificacion}
                onChange={(e) => setCalificacion(Number(e.target.value))}
                className="mt-4 w-full accent-blue-600"
              />

              {/* emojis bonitos (1, 5, 10) */}
              <div className="mt-3 flex items-center justify-between text-xs font-semibold text-slate-500">
                <span className="flex items-center gap-2">
                  1 <span className="text-base">😟</span>
                </span>
                <span className="flex items-center gap-2">
                  5 <span className="text-base">🙂</span>
                </span>
                <span className="flex items-center gap-2">
                  10 <span className="text-base">🤩</span>
                </span>
              </div>
            </div>

            {/* comentario */}
            <div className="mt-4">
              <label className="mb-1 block text-xs font-semibold text-slate-600">
                Comentario (opcional)
              </label>
              <textarea
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                placeholder="¿Cómo fue la tutoría? ¿Qué te ayudó más?"
                className="
                  w-full rounded-2xl border-2 border-blue-100 bg-white px-4 py-3
                  text-sm text-slate-900 placeholder-slate-400
                  focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100
                "
                rows={4}
              />
            </div>

            {/* acciones */}
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                onClick={() => setOpenRate(false)}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </button>

              <button
                onClick={guardarCalificacion}
                disabled={saving}
                className="
                  inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2
                  text-sm font-semibold text-white shadow-md transition hover:bg-blue-700
                  disabled:opacity-60 disabled:cursor-not-allowed
                "
              >
                {saving ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Guardando…
                  </>
                ) : (
                  <>
                    <StarIcon className="h-5 w-5" />
                    Enviar calificación
                  </>
                )}
              </button>
            </div>
          </div>


        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-[80] -translate-x-1/2 rounded-full border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
