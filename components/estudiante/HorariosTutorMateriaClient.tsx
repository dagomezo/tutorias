"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import UserMenu from "@/components/UserMenu";
import { ChevronRightIcon, XMarkIcon } from "@heroicons/react/24/outline";

export type TutorMateriaDetalle = {
  tutor_materia_id: number;
  materia_id: number;
  materia_nombre: string;
  tutor_id: number;
  tutor_nombre: string;
  tutor_apellido: string;
  tutor_carrera: string;
  tutor_imagen: string | null;
  semestres: string[];
  modalidad_presencial: boolean;
  modalidad_virtual: boolean;
};

export type DisponibilidadBase = {
  dia_semana:
    | "LUNES"
    | "MARTES"
    | "MIERCOLES"
    | "JUEVES"
    | "VIERNES"
    | "SABADO"
    | "DOMINGO";
  hora_inicio: string; // "HH:MM:SS"
  hora_fin: string; // "HH:MM:SS"
};

type Slot = {
  id: string;
  fechaISO: string;
  fechaLabel: string;
  horaInicio: string;
  horaFin: string;
};

interface HorariosTutorMateriaClientProps {
  detalle: TutorMateriaDetalle;
  disponibilidad: DisponibilidadBase[];
}

type UsuarioLS = {
  id: number;
  nombre?: string;
  apellido?: string;
  email?: string;
  rol?: string;

  // ✅ si lo tienes en localStorage, perfecto:
  cedula?: string;
};

const DIAS_MAP: Record<DisponibilidadBase["dia_semana"], number> = {
  LUNES: 1,
  MARTES: 2,
  MIERCOLES: 3,
  JUEVES: 4,
  VIERNES: 5,
  SABADO: 6,
  DOMINGO: 0,
};

function parseTimeToMinutes(time: string): number {
  const [h, m] = time.split(":").map((x) => parseInt(x, 10));
  return h * 60 + m;
}

function minutesToHHMM(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const hh = String(h).padStart(2, "0");
  const mm = String(m).padStart(2, "0");
  return `${hh}:${mm}`;
}

function toIsoDatetimeLocal(dateISO: string, hhmm: string) {
  // "2025-12-15T08:00"
  return `${dateISO}T${hhmm}`;
}

export default function HorariosTutorMateriaClient({
  detalle,
  disponibilidad,
}: HorariosTutorMateriaClientProps) {
  const router = useRouter();

  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"slot" | "custom">("slot");

  // ✅ default: VIRTUAL
  const [modalidad, setModalidad] = useState<"VIRTUAL" | "PRESENCIAL">("VIRTUAL");
  const [lugar, setLugar] = useState("");
  const [comentario, setComentario] = useState("");

  // fuera de horario
  const [customFecha, setCustomFecha] = useState("");
  const [customHoraInicio, setCustomHoraInicio] = useState("");
  const [customHoraFin, setCustomHoraFin] = useState("");

  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState<{ type: "ok" | "error"; msg: string } | null>(null);

  // ✅ datos necesarios para API
  const [estudianteId, setEstudianteId] = useState<number | null>(null);
  const [nombreEst, setNombreEst] = useState<string>("");
  const [cedulaEst, setCedulaEst] = useState<string>("");

  // leer usuario
  useEffect(() => {
    try {
      const raw = localStorage.getItem("user");
      if (!raw) return;

      const parsed = JSON.parse(raw) as UsuarioLS;

      setEstudianteId(parsed.id ?? null);
      setNombreEst(`${parsed.nombre ?? ""} ${parsed.apellido ?? ""}`.trim());

      // ✅ si guardas cedula en LS, la tomamos:
      if (parsed.cedula) setCedulaEst(String(parsed.cedula).trim());
    } catch (e) {
      console.error("Error leyendo localStorage user en HorariosTutorMateriaClient", e);
    }
  }, []);

  // ⚠️ Si NO guardas cédula en localStorage, debes obtenerla desde BD con un endpoint.
  // Te dejo el fetch listo (comenta si no lo necesitas):
  useEffect(() => {
    const fetchCedula = async () => {
      if (!estudianteId) return;
      if (cedulaEst) return;

      try {
        const res = await fetch(`/api/estudiante/perfil?estudianteId=${estudianteId}`, {
          cache: "no-store",
        });
        const data = await res.json().catch(() => null);
        if (!res.ok) return;

        // esperamos: { estudiante: { cedula: "..." , nombre, apellido } }
        const ced = String(data?.estudiante?.cedula ?? "").trim();
        if (ced) setCedulaEst(ced);

        const nom = `${data?.estudiante?.nombre ?? ""} ${data?.estudiante?.apellido ?? ""}`.trim();
        if (nom) setNombreEst(nom);
      } catch {}
    };

    fetchCedula();
  }, [estudianteId, cedulaEst]);

  // generar slots para próximos 7 días
  useEffect(() => {
    const hoy = new Date();
    const diasMostrar = 7;
    const nuevosSlots: Slot[] = [];

    for (let offset = 0; offset < diasMostrar; offset++) {
      const fecha = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + offset);
      const day = fecha.getDay(); // 0 = domingo

      disponibilidad.forEach((disp) => {
        const diaNum = DIAS_MAP[disp.dia_semana];
        if (diaNum !== day) return;

        const startMins = parseTimeToMinutes(disp.hora_inicio.slice(0, 5));
        const endMins = parseTimeToMinutes(disp.hora_fin.slice(0, 5));
        const step = 60;

        for (let m = startMins; m + step <= endMins; m += step) {
          const inicio = minutesToHHMM(m);
          const fin = minutesToHHMM(m + step);

          const yyyy = fecha.getFullYear();
          const mm = String(fecha.getMonth() + 1).padStart(2, "0");
          const dd = String(fecha.getDate()).padStart(2, "0");

          const fechaISO = `${yyyy}-${mm}-${dd}`;
          const diaNombreCorto = fecha.toLocaleDateString("es-EC", { weekday: "short" });
          const fechaLabel = `${diaNombreCorto.toUpperCase()} ${dd}/${mm}`;

          nuevosSlots.push({
            id: `${fechaISO}T${inicio}`,
            fechaISO,
            fechaLabel,
            horaInicio: inicio,
            horaFin: fin,
          });
        }
      });
    }

    setSlots(nuevosSlots);
    setSelectedSlotId(null);
  }, [disponibilidad]);

  const slotsPorDia = useMemo(() => {
    const map = new Map<string, { label: string; slots: Slot[] }>();
    for (const s of slots) {
      if (!map.has(s.fechaISO)) map.set(s.fechaISO, { label: s.fechaLabel, slots: [] });
      map.get(s.fechaISO)!.slots.push(s);
    }

    return Array.from(map.entries())
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([fechaISO, group]) => ({ fechaISO, label: group.label, slots: group.slots }));
  }, [slots]);

  const selectedSlot = useMemo(
    () => slots.find((s) => s.id === selectedSlotId) || null,
    [slots, selectedSlotId]
  );

  const puedeInscribirse = !!selectedSlot; // habilita botón inferior
  const puedeCustom = true;

  const inicialesTutor = `${detalle.tutor_nombre?.[0] ?? ""}${detalle.tutor_apellido?.[0] ?? ""}`.toUpperCase();

  const validarAntesEnviar = (fechaIni: string, fechaFin: string) => {
    if (!estudianteId) throw new Error("No se encontró tu sesión. Inicia sesión otra vez.");
    if (!nombreEst) throw new Error("No se encontró tu nombre. Vuelve a iniciar sesión.");
    if (!cedulaEst) throw new Error("No se encontró tu cédula. Ve a tu perfil o vuelve a iniciar sesión.");

    if (!detalle?.tutor_id || !detalle?.materia_id) {
      throw new Error("No se pudo identificar tutor o materia.");
    }

    if (!fechaIni || !fechaFin) throw new Error("Selecciona/propón un horario válido.");

    // PRESENCIAL => lugar obligatorio
    if (modalidad === "PRESENCIAL" && !lugar.trim()) {
      throw new Error("El lugar es obligatorio para modalidad PRESENCIAL.");
    }
  };

  const handleEnviarSolicitud = async () => {
    setSending(true);
    setToast(null);

    try {
      let fecha_hora_inicio = "";
      let fecha_hora_fin = "";

      if (modalMode === "slot") {
        if (!selectedSlot) throw new Error("Selecciona un horario válido.");
        fecha_hora_inicio = toIsoDatetimeLocal(selectedSlot.fechaISO, selectedSlot.horaInicio);
        fecha_hora_fin = toIsoDatetimeLocal(selectedSlot.fechaISO, selectedSlot.horaFin);
      } else {
        if (!customFecha || !customHoraInicio || !customHoraFin) {
          throw new Error("Completa la fecha y las horas para la solicitud.");
        }
        fecha_hora_inicio = toIsoDatetimeLocal(customFecha, customHoraInicio);
        fecha_hora_fin = toIsoDatetimeLocal(customFecha, customHoraFin);
      }

      validarAntesEnviar(fecha_hora_inicio, fecha_hora_fin);

      // ✅ BODY EXACTO que exige /api/estudiante/solicitudes
      const res = await fetch("/api/estudiante/solicitudes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          estudianteId,
          tutorId: detalle.tutor_id,
          materiaId: detalle.materia_id,
          nombre_estudiante: nombreEst,
          cedula_estudiante: cedulaEst,
          fecha_hora_inicio,
          fecha_hora_fin,
          modalidad,
          comentario: comentario?.trim() ? comentario.trim() : null,

          // NOTA: tu API actual no guarda "lugar".
          // Si quieres guardarlo, lo agregamos a sesiones_tutoria o a una tabla extra.
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Error al enviar la solicitud");

      setToast({ type: "ok", msg: "Solicitud enviada. El tutor revisará tu petición." });

      setModalOpen(false);
      setComentario("");
      setLugar("");
      setCustomFecha("");
      setCustomHoraInicio("");
      setCustomHoraFin("");
      if (modalMode === "slot") setSelectedSlotId(null);
    } catch (err: any) {
      setToast({ type: "error", msg: err?.message || "Ocurrió un error al enviar la solicitud" });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-white">
      <main className="mx-auto flex max-w-6xl flex-col px-4 py-8 sm:px-8 lg:py-10">
        {/* HEADER */}
        <header className="mb-6 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="h-12 w-12 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-semibold overflow-hidden">
              {detalle.tutor_imagen ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={detalle.tutor_imagen}
                  alt={`${detalle.tutor_nombre} ${detalle.tutor_apellido}`}
                  className="h-12 w-12 rounded-full object-cover"
                />
              ) : (
                inicialesTutor || "?"
              )}
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-1 cursor-pointer" onClick={() => router.back()}>
                ← Volver a tutores
              </p>
              <h1 className="text-xl font-semibold text-slate-900">
                {detalle.tutor_nombre} {detalle.tutor_apellido}
              </h1>
              <p className="text-xs text-slate-500">{detalle.tutor_carrera || "Tutor universitario"}</p>

              <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
                <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 font-medium text-slate-700 border border-slate-200">
                  {detalle.materia_nombre}
                </span>

                {detalle.semestres.length > 0 && (
                  <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 font-medium text-indigo-700 border border-indigo-100">
                    Semestres: {detalle.semestres.join(", ")}
                  </span>
                )}

                <span className="inline-flex items-center rounded-full bg-sky-50 px-2.5 py-0.5 font-medium text-sky-700 border border-sky-100">
                  Modalidad por defecto: VIRTUAL
                </span>
              </div>
            </div>
          </div>

          {/* LADO DERECHO */}
          <div className="shrink-0 flex flex-col items-end gap-3">
            <UserMenu />
            <button
              type="button"
              onClick={() => {
                setModalMode("custom");
                setModalOpen(true);
              }}
              className="
                inline-flex items-center justify-center
                rounded-full border-2 border-indigo-300
                bg-white
                px-4 py-1.5
                text-xs font-medium text-indigo-700
                shadow-[0_10px_25px_rgba(37,99,235,0.16)]
                transition-all
                hover:border-indigo-500 hover:shadow-[0_16px_35px_rgba(37,99,235,0.24)]
              "
            >
              Solicitar tutoría fuera de horario
            </button>
          </div>
        </header>

        {/* TOAST */}
        {toast && (
          <div
            className={`mb-4 rounded-xl px-4 py-2 text-xs ${
              toast.type === "ok"
                ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                : "bg-red-50 text-red-700 border border-red-100"
            }`}
          >
            {toast.msg}
          </div>
        )}

        {/* HORARIOS */}
        <section className="flex-1">
          <h2 className="mb-2 text-sm font-semibold text-slate-800">
            Horarios disponibles (próximos 7 días)
          </h2>

          {slotsPorDia.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-indigo-200 bg-indigo-50/50 px-4 py-10 text-center text-sm text-slate-500 shadow-[0_12px_30px_rgba(37,99,235,0.12)]">
              Este tutor aún no tiene horarios configurados.
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {slotsPorDia.map((grupo) => (
                  <div
                    key={grupo.fechaISO}
                    className="
                      rounded-2xl border-2 border-indigo-100
                      bg-white
                      px-4 py-3
                      shadow-[0_14px_35px_rgba(37,99,235,0.14)]
                      transition-all
                      hover:border-indigo-300
                      hover:shadow-[0_20px_45px_rgba(37,99,235,0.22)]
                    "
                  >
                    <p className="mb-2 text-xs font-semibold text-slate-700">{grupo.label}</p>
                    <div className="flex flex-wrap gap-2">
                      {grupo.slots.map((s) => {
                        const selected = selectedSlotId === s.id;
                        return (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => setSelectedSlotId(selected ? null : s.id)}
                            className={`rounded-full border px-3 py-1 text-xs font-medium transition-all
                              ${
                                selected
                                  ? "border-indigo-500 bg-indigo-50 text-indigo-700 shadow-[0_0_0_1px_rgba(79,70,229,0.45)]"
                                  : "border-indigo-100 bg-white text-slate-700 hover:border-indigo-300 hover:bg-indigo-50"
                              }`}
                          >
                            {s.horaInicio} – {s.horaFin}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {!selectedSlot && (
                <p className="mt-2 text-[11px] text-slate-400">
                  Selecciona un horario para poder{" "}
                  <span className="font-semibold">inscribirte a la tutoría</span>.
                </p>
              )}
            </>
          )}
        </section>

        {/* BOTÓN INFERIOR IZQUIERDO */}
        <div className="mt-8 flex justify-start">
          <button
            type="button"
            disabled={!puedeInscribirse}
            onClick={() => {
              setModalMode("slot");
              setModalOpen(true);
            }}
            className="
              inline-flex items-center justify-center gap-2
              rounded-full
              bg-indigo-600
              px-5 py-2
              text-sm font-medium text-white
              shadow-[0_16px_40px_rgba(79,70,229,0.55)]
              transition-all
              hover:bg-indigo-700
              hover:shadow-[0_20px_50px_rgba(79,70,229,0.65)]
              disabled:bg-slate-300 disabled:shadow-none disabled:cursor-not-allowed
            "
          >
            Inscribirse a la tutoría
            <ChevronRightIcon className="h-4 w-4" />
          </button>
        </div>

        {/* MODAL */}
        {modalOpen && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/25 backdrop-blur-sm px-4">
            <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">
                    {modalMode === "slot"
                      ? "Inscribirte a la tutoría"
                      : "Solicitar tutoría fuera de horario"}{" "}
                    con {detalle.tutor_nombre} {detalle.tutor_apellido}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    {modalMode === "slot"
                      ? "Confirma la información de tu sesión."
                      : "Propón un horario alternativo que se ajuste mejor a ti."}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-full p-1 hover:bg-slate-100"
                >
                  <XMarkIcon className="h-4 w-4 text-slate-500" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-medium text-slate-700">Materia</label>
                  <p className="mt-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700">
                    {detalle.materia_nombre}
                  </p>
                </div>

                {modalMode === "slot" && selectedSlot && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block font-medium text-slate-700">Fecha</label>
                      <p className="mt-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700">
                        {selectedSlot.fechaLabel}
                      </p>
                    </div>
                    <div>
                      <label className="block font-medium text-slate-700">Hora</label>
                      <p className="mt-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700">
                        {selectedSlot.horaInicio} – {selectedSlot.horaFin}
                      </p>
                    </div>
                  </div>
                )}

                {modalMode === "custom" && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block font-medium text-slate-700">Fecha propuesta</label>
                      <input
                        type="date"
                        value={customFecha}
                        onChange={(e) => setCustomFecha(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-slate-700">Hora (inicio y fin)</label>
                      <div className="mt-1 flex gap-2">
                        <input
                          type="time"
                          value={customHoraInicio}
                          onChange={(e) => setCustomHoraInicio(e.target.value)}
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                        />
                        <input
                          type="time"
                          value={customHoraFin}
                          onChange={(e) => setCustomHoraFin(e.target.value)}
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block font-medium text-slate-700">Modalidad</label>
                  <select
                    value={modalidad}
                    onChange={(e) => setModalidad(e.target.value as "VIRTUAL" | "PRESENCIAL")}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  >
                    <option value="VIRTUAL">VIRTUAL (recomendada)</option>
                    <option value="PRESENCIAL">PRESENCIAL</option>
                  </select>
                </div>

                {modalidad === "PRESENCIAL" && (
                  <div>
                    <label className="block font-medium text-slate-700">Lugar de encuentro</label>
                    <input
                      type="text"
                      value={lugar}
                      onChange={(e) => setLugar(e.target.value)}
                      placeholder="Ej: Biblioteca, Aula B-203"
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>
                )}

                <div>
                  <label className="block font-medium text-slate-700">
                    Comentario / tema en el que necesitas ayuda
                  </label>
                  <textarea
                    value={comentario}
                    onChange={(e) => setComentario(e.target.value)}
                    rows={3}
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    placeholder="Describe brevemente el ejercicio o tema donde necesitas apoyo."
                  />
                </div>
              </div>

              <div className="mt-5 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-full border border-slate-200 px-4 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={sending}
                  onClick={handleEnviarSolicitud}
                  className="
                    inline-flex items-center justify-center gap-2
                    rounded-full
                    bg-indigo-600
                    px-4 py-1.5
                    text-xs font-medium text-white
                    shadow-sm
                    hover:bg-indigo-700
                    disabled:bg-slate-400 disabled:cursor-not-allowed
                  "
                >
                  {sending ? "Enviando..." : "Enviar solicitud"}
                </button>
              </div>

              {!cedulaEst && (
                <p className="mt-3 text-[11px] text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                  Aviso: tu cédula no está disponible. Guarda la cédula en el localStorage al iniciar sesión
                  o crea el endpoint <span className="font-semibold">/api/estudiante/perfil</span>.
                </p>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
