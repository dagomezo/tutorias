"use client";

import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import {
  CalendarDaysIcon,
} from "@heroicons/react/24/outline";
import Toast from "@/components/ui/Toast";

type MateriaTutor = {
  id: number;
  nombre: string;
  descripcion: string | null;
  semestres: string | null;
};

type DisponibilidadRow = {
  id: number;
  tutor_id: number;
  dia_semana: string;
  hora_inicio: string;
  hora_fin: string;
};

const DIAS_SEMANA: string[] = [
  "LUNES",
  "MARTES",
  "MIERCOLES",
  "JUEVES",
  "VIERNES",
  "SABADO",
  "DOMINGO",
];

type FormDisponibilidad = {
  id?: number;
  dia_semana: string;
  hora_inicio: string;
  hora_fin: string;
};

export default function MateriasTutorClient() {
  const [tutorId, setTutorId] = useState<number | null>(null);
  const [materias, setMaterias] = useState<MateriaTutor[]>([]);
  const [loadingMaterias, setLoadingMaterias] = useState(true);
  const [errorMaterias, setErrorMaterias] = useState<string | null>(null);

  const [dispModalOpen, setDispModalOpen] = useState(false);
  const [disponibilidad, setDisponibilidad] = useState<DisponibilidadRow[]>([]);
  const [loadingDisp, setLoadingDisp] = useState(false);
  const [formDisp, setFormDisp] = useState<FormDisponibilidad>({
    dia_semana: "LUNES",
    hora_inicio: "",
    hora_fin: "",
  });
  const [editingDispId, setEditingDispId] = useState<number | null>(null);
  const [savingDisp, setSavingDisp] = useState(false);
  const [deletingDispId, setDeletingDispId] = useState<number | null>(null);

  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // =====================
  // 1. Obtener tutorId desde localStorage
  // =====================
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const raw = localStorage.getItem("user");
      if (!raw) {
        setErrorMaterias("No hay usuario en sesión.");
        setLoadingMaterias(false);
        return;
      }
      const user = JSON.parse(raw);
      if (!user || user.rol !== "TUTOR") {
        setErrorMaterias("Solo los tutores pueden ver esta sección.");
        setLoadingMaterias(false);
        return;
      }
      setTutorId(Number(user.id));
    } catch (err) {
      console.error("Error leyendo user localStorage:", err);
      setErrorMaterias("Error al leer la sesión de usuario.");
      setLoadingMaterias(false);
    }
  }, []);

  // =====================
  // 2. Cargar materias del tutor
  // =====================
  useEffect(() => {
    if (!tutorId) return;

    const fetchMaterias = async () => {
      setLoadingMaterias(true);
      setErrorMaterias(null);

      try {
        const res = await fetch(`/api/tutor/materias?tutorId=${tutorId}`);
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data?.message || "Error al cargar materias.");
        }
        setMaterias(data.materias || []);
      } catch (err: any) {
        setErrorMaterias(
          err.message || "Ocurrió un error al cargar tus materias."
        );
      } finally {
        setLoadingMaterias(false);
      }
    };

    fetchMaterias();
  }, [tutorId]);

  // =====================
  // 3. Abrir modal de disponibilidad -> cargar franjas
  // =====================
  const openDispModal = async () => {
    if (!tutorId) return;

    setDispModalOpen(true);
    setLoadingDisp(true);
    setError(null);
    setMensaje(null);
    setEditingDispId(null);
    setFormDisp({
      dia_semana: "LUNES",
      hora_inicio: "",
      hora_fin: "",
    });

    try {
      const res = await fetch(`/api/tutor/disponibilidad?tutorId=${tutorId}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "Error al cargar disponibilidad.");
      }
      setDisponibilidad(data.disponibilidad || []);
    } catch (err: any) {
      setError(err.message || "Ocurrió un error al cargar disponibilidad.");
    } finally {
      setLoadingDisp(false);
    }
  };

  // =====================
  // 4. Helpers de tiempo (validar “no pasado”)
  // =====================
  const esFranjaEnPasado = (dia_semana: string, hora_inicio: string) => {
    const now = new Date();

    // getDay: 0=Dom,1=Lun,...6=Sab
    const jsDay = now.getDay(); // 0..6
    // Queremos LUNES=0, ... DOMINGO=6
    const todayIndex = (jsDay + 6) % 7;

    const index = DIAS_SEMANA.indexOf(dia_semana);
    if (index === -1) return false; // Por si acaso

    // Día anterior a hoy -> se considera pasado
    if (index < todayIndex) return true;

    // Día después de hoy -> futuro (ok)
    if (index > todayIndex) return false;

    // Mismo día -> revisar hora
    if (!hora_inicio) return false;

    const [h, m] = hora_inicio.split(":").map(Number);
    const ahoraMin = now.getHours() * 60 + now.getMinutes();
    const franjaMin = h * 60 + m;

    return franjaMin <= ahoraMin;
  };

  // =====================
  // 5. CRUD disponibilidad
  // =====================
  const handleChangeDisp = (
    ev: ChangeEvent<HTMLSelectElement | HTMLInputElement>
  ) => {
    const { name, value } = ev.target;
    setFormDisp((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitDisp = async (ev: FormEvent) => {
    ev.preventDefault();
    if (!tutorId) return;

    setSavingDisp(true);
    setError(null);
    setMensaje(null);

    try {
      const { dia_semana, hora_inicio, hora_fin } = formDisp;

      if (!dia_semana || !hora_inicio || !hora_fin) {
        throw new Error("Todos los campos de la franja son obligatorios.");
      }

      if (hora_fin <= hora_inicio) {
        throw new Error("La hora fin debe ser mayor a la hora inicio.");
      }

      // Validación “no pasado”
      if (esFranjaEnPasado(dia_semana, hora_inicio)) {
        throw new Error(
          "No puedes crear o editar una franja en un día u hora que ya han pasado."
        );
      }

      if (editingDispId) {
        // UPDATE
        const res = await fetch(`/api/tutor/disponibilidad/${editingDispId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dia_semana, hora_inicio, hora_fin }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(
            data?.message || "Error al actualizar franja de disponibilidad."
          );
        }

        setDisponibilidad((prev) =>
          prev.map((d) => (d.id === editingDispId ? data.disponibilidad : d))
        );
        setMensaje("Franja actualizada correctamente.");
      } else {
        // CREATE
        const res = await fetch("/api/tutor/disponibilidad", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tutorId,
            dia_semana,
            hora_inicio,
            hora_fin,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(
            data?.message || "Error al crear franja de disponibilidad."
          );
        }

        setDisponibilidad((prev) => [...prev, data.disponibilidad]);
        setMensaje("Franja creada correctamente.");
      }

      // Reset formulario a modo “crear”
      setEditingDispId(null);
      setFormDisp({
        dia_semana,
        hora_inicio: "",
        hora_fin: "",
      });
    } catch (err: any) {
      setError(err.message || "Ocurrió un error al guardar la franja.");
    } finally {
      setSavingDisp(false);
    }
  };

  const handleEditDisp = (row: DisponibilidadRow) => {
    setEditingDispId(row.id);
    setFormDisp({
      id: row.id,
      dia_semana: row.dia_semana,
      hora_inicio: row.hora_inicio.slice(0, 5),
      hora_fin: row.hora_fin.slice(0, 5),
    });
  };

  const handleDeleteDisp = async (row: DisponibilidadRow) => {
    if (!confirm("¿Eliminar esta franja de disponibilidad?")) return;

    try {
      setDeletingDispId(row.id);
      setError(null);
      setMensaje(null);

      const res = await fetch(`/api/tutor/disponibilidad/${row.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          data?.message || "Error al eliminar franja de disponibilidad."
        );
      }

      setDisponibilidad((prev) => prev.filter((d) => d.id !== row.id));
      setMensaje("Franja eliminada correctamente.");
    } catch (err: any) {
      setError(err.message || "Ocurrió un error al eliminar la franja.");
    } finally {
      setDeletingDispId(null);
    }
  };

  const dispPorDia = useMemo(() => {
    const map: Record<string, DisponibilidadRow[]> = {};
    for (const d of disponibilidad) {
      if (!map[d.dia_semana]) map[d.dia_semana] = [];
      map[d.dia_semana].push(d);
    }
    return map;
  }, [disponibilidad]);

  // =====================
  // RENDER
  // =====================

  if (loadingMaterias && !tutorId) {
    return (
      <p className="text-xs text-slate-500">
        Cargando datos de tu sesión…
      </p>
    );
  }

  if (errorMaterias) {
    return (
      <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">
        {errorMaterias}
      </p>
    );
  }

  return (
    <>
      {/* LISTA DE MATERIAS */}
      {loadingMaterias ? (
        <p className="text-xs text-slate-500">
          Cargando tus materias…
        </p>
      ) : materias.length === 0 ? (
        <p className="text-xs text-slate-500">
          No tienes materias asignadas todavía. Contacta al administrador.
        </p>
      ) : (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {materias.map((m) => (
            <article
              key={m.id}
              className="
                rounded-2xl 
                border-[2px] border-indigo-200 
                bg-white 
                shadow-md 
                hover:shadow-xl 
                hover:border-indigo-400 
                transition-all 
                duration-300 
                p-5 
                flex 
                flex-col
              "
            >
              <div className="mb-3">
                <h3 className="text-sm font-semibold text-slate-900">
                  {m.nombre}
                </h3>
                <p className="text-[11px] text-indigo-700 mt-1">
                  Semestres:{" "}
                  <span className="font-medium">
                    {m.semestres || "No configurados"}
                  </span>
                </p>
              </div>

              {m.descripcion && (
                <p className="mb-4 text-[11px] text-slate-600 line-clamp-4">
                  {m.descripcion}
                </p>
              )}

              <div className="mt-auto pt-2 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={openDispModal}
                  className="inline-flex items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 text-[11px] font-medium text-indigo-700 px-3 py-1 hover:bg-indigo-100"
                >
                  <CalendarDaysIcon className="h-4 w-4" />
                  Mi disponibilidad
                </button>
              </div>
            </article>
          ))}
        </section>
      )}

      {/* MODAL: CALENDARIO / DISPONIBILIDAD */}
      {dispModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40">
          <div className="
                  w-full max-w-5xl 
                  rounded-3xl 
                  bg-white 
                  shadow-[0_8px_30px_rgba(0,0,0,0.12)]
                  border border-slate-200
                  p-8 
                  max-h-[90vh] 
                  overflow-y-auto
                  animate-fadeIn
                ">

            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Mi disponibilidad semanal
                </h2>
                <p className="text-[11px] text-slate-500">
                  Gestiona las franjas de horario en las que puedes impartir tutorías.
                  No se permiten franjas en días u horas ya pasados.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDispModalOpen(false)}
                className="text-xs text-slate-500 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            {/* FORMULARIO CREAR / EDITAR FRANJA */}
            <form
              className="
                          mb-6 grid gap-4 text-xs 
                          border border-indigo-200 
                          rounded-2xl 
                          p-5 
                          bg-indigo-50/40 
                          shadow-inner
                        "

              onSubmit={handleSubmitDisp}
            >
              <div className="grid sm:grid-cols-3 gap-3">
                <div>
                  <label className="block mb-1 text-slate-600">
                    Día de la semana
                  </label>
                  <select
                    name="dia_semana"
                    value={formDisp.dia_semana}
                    onChange={handleChangeDisp}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {DIAS_SEMANA.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block mb-1 text-slate-600">
                    Hora inicio
                  </label>
                  <input
                    type="time"
                    name="hora_inicio"
                    value={formDisp.hora_inicio}
                    onChange={handleChangeDisp}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block mb-1 text-slate-600">
                    Hora fin
                  </label>
                  <input
                    type="time"
                    name="hora_fin"
                    value={formDisp.hora_fin}
                    onChange={handleChangeDisp}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-1">
                {editingDispId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingDispId(null);
                      setFormDisp({
                        dia_semana: "LUNES",
                        hora_inicio: "",
                        hora_fin: "",
                      });
                    }}
                    className="rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Cancelar edición
                  </button>
                )}
                <button
                  type="submit"
                  disabled={savingDisp}
                  className="rounded-md bg-indigo-600 text-white px-4 py-2 text-xs font-medium hover:bg-indigo-700 disabled:opacity-60"
                >
                  {savingDisp
                    ? "Guardando…"
                    : editingDispId
                    ? "Guardar cambios"
                    : "Agregar franja"}
                </button>
              </div>
            </form>

            {/* “Calendario” semanal (grid por días) */}
            <div className="grid grid-cols-1 md:grid-cols-7 gap-3 text-xs">
              {DIAS_SEMANA.map((dia) => (
                <div
                    key={dia}
                    className="
                      rounded-2xl 
                      border border-slate-300 
                      bg-white 
                      shadow-sm 
                      hover:shadow-md 
                      transition-all 
                      p-4 
                      flex flex-col
                    "
                  >

                  <div className="mb-2 text-center">
                    <p className="text-[11px] font-semibold text-slate-800">
                      {dia}
                    </p>
                  </div>

                  <div className="space-y-1 flex-1">
                    {(dispPorDia[dia] || []).length === 0 ? (
                      <p className="text-[10px] text-slate-400 text-center">
                        Sin franjas
                      </p>
                    ) : (
                      dispPorDia[dia].map((d) => (
                        <div
                          key={d.id}
                          className="
                              flex items-center justify-between 
                              rounded-xl 
                              border border-indigo-200 
                              bg-indigo-50 
                              px-3 py-2 
                              shadow-sm 
                            "

                        >
                          <div>
                            <p className="text-[11px] font-medium text-slate-800">
                              {d.hora_inicio.slice(0, 5)} -{" "}
                              {d.hora_fin.slice(0, 5)}
                            </p>
                          </div>
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() => handleEditDisp(d)}
                              className="text-[10px] text-indigo-600 hover:text-indigo-800"
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteDisp(d)}
                              disabled={deletingDispId === d.id}
                              className="text-[10px] text-red-600 hover:text-red-800 disabled:opacity-60"
                            >
                              {deletingDispId === d.id
                                ? "..."
                                : "Eliminar"}
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TOASTS */}
      {mensaje && (
        <Toast
          type="success"
          message={mensaje}
          durationMs={3000}
          onClose={() => setMensaje(null)}
        />
      )}
      {error && (
        <Toast
          type="error"
          message={error}
          durationMs={3000}
          onClose={() => setError(null)}
        />
      )}
    </>
  );
}
