"use client";

import {
  useState,
  useMemo,
  type ChangeEvent,
  type FormEvent,
} from "react";
import {
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  BookOpenIcon,
  CalendarDaysIcon,
} from "@heroicons/react/24/outline";
import Toast from "@/components/ui/Toast";

type TutorAdmin = {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  rol: string;
  imagen_perfil: string | null;
  telefono: string | null;
  carrera: string | null;
  descripcion: string | null;
  link_zoom: string | null;
};

type Props = {
  initialTutores: TutorAdmin[];
};

type ModalMode = "create" | "edit";

type MateriaTutor = {
  id: number;
  materiaId: number;
  nombre: string;
  descripcion: string | null;
  semestres: string | null;
};

type DisponibilidadRow = {
  id: number;
  dia_semana: string;
  hora_inicio: string;
  hora_fin: string;
};

export default function TutoresAdminClient({ initialTutores }: Props) {
  const [tutores, setTutores] = useState<TutorAdmin[]>(initialTutores);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>("create");
  const [form, setForm] = useState({
    id: 0,
    nombre: "",
    apellido: "",
    email: "",
    telefono: "",
    carrera: "",
    descripcion: "",
    link_zoom: "",
  });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Modales para materias y disponibilidad
  const [materiasModalOpen, setMateriasModalOpen] = useState(false);
  const [dispModalOpen, setDispModalOpen] = useState(false);
  const [materiasTutor, setMateriasTutor] = useState<MateriaTutor[]>([]);
  const [dispTutor, setDispTutor] = useState<DisponibilidadRow[]>([]);
  const [tutorActual, setTutorActual] = useState<TutorAdmin | null>(null);
  const [loadingExtra, setLoadingExtra] = useState(false);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return tutores;
    return tutores.filter((t) => {
      return (
        t.nombre.toLowerCase().includes(q) ||
        t.apellido.toLowerCase().includes(q) ||
        t.email.toLowerCase().includes(q)
      );
    });
  }, [search, tutores]);

  const openCreateModal = () => {
    setForm({
      id: 0,
      nombre: "",
      apellido: "",
      email: "",
      telefono: "",
      carrera: "",
      descripcion: "",
      link_zoom: "",
    });
    setModalMode("create");
    setMensaje(null);
    setError(null);
    setModalOpen(true);
  };

  const openEditModal = (t: TutorAdmin) => {
    setForm({
      id: t.id,
      nombre: t.nombre,
      apellido: t.apellido,
      email: t.email,
      telefono: t.telefono || "",
      carrera: t.carrera || "",
      descripcion: t.descripcion || "",
      link_zoom: t.link_zoom || "",
    });
    setModalMode("edit");
    setMensaje(null);
    setError(null);
    setModalOpen(true);
  };

  const handleChangeForm = (
    ev: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = ev.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (ev: FormEvent) => {
    ev.preventDefault();
    setSaving(true);
    setMensaje(null);
    setError(null);

    try {
      if (!form.nombre || !form.apellido || !form.email) {
        throw new Error("Nombre, apellido y email son obligatorios.");
      }

      if (modalMode === "create") {
        const res = await fetch("/api/admin/tutores", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nombre: form.nombre.trim(),
            apellido: form.apellido.trim(),
            email: form.email.trim(),
            telefono: form.telefono.trim() || null,
            carrera: form.carrera.trim() || null,
            descripcion: form.descripcion.trim() || null,
            link_zoom: form.link_zoom.trim() || null,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data?.message || "Error al crear tutor.");
        }

        setTutores((prev) => [...prev, data.tutor as TutorAdmin]);
        setMensaje("Tutor creado correctamente.");
        setModalOpen(false);
      } else {
        const res = await fetch(`/api/admin/tutores/${form.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nombre: form.nombre.trim(),
            apellido: form.apellido.trim(),
            email: form.email.trim(),
            telefono: form.telefono.trim() || null,
            carrera: form.carrera.trim() || null,
            descripcion: form.descripcion.trim() || null,
            link_zoom: form.link_zoom.trim() || null,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data?.message || "Error al actualizar tutor.");
        }

        setTutores((prev) =>
          prev.map((t) =>
            t.id === form.id ? (data.tutor as TutorAdmin) : t
          )
        );
        setMensaje("Tutor actualizado correctamente.");
        setModalOpen(false);
      }
    } catch (err: any) {
      setError(err.message || "Ocurrió un error al guardar.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (t: TutorAdmin) => {
    if (!confirm(`¿Eliminar al tutor "${t.nombre} ${t.apellido}"?`)) {
      return;
    }

    try {
      setDeletingId(t.id);
      setMensaje(null);
      setError(null);

      const res = await fetch(`/api/admin/tutores/${t.id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "Error al eliminar tutor.");
      }

      setTutores((prev) => prev.filter((x) => x.id !== t.id));
      setMensaje("Tutor eliminado correctamente.");
    } catch (err: any) {
      setError(err.message || "Ocurrió un error al eliminar.");
    } finally {
      setDeletingId(null);
    }
  };

  // --------- Materias / Disponibilidad ---------

  const openMateriasModal = async (t: TutorAdmin) => {
    try {
      setTutorActual(t);
      setMateriasTutor([]);
      setLoadingExtra(true);
      setMateriasModalOpen(true);

      const res = await fetch(`/api/admin/tutores/${t.id}/materias`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Error al cargar materias.");
      }
      setMateriasTutor(data.materias || []);
    } catch (err: any) {
      setError(err.message || "Error al cargar materias del tutor.");
    } finally {
      setLoadingExtra(false);
    }
  };

  const openDispModal = async (t: TutorAdmin) => {
    try {
      setTutorActual(t);
      setDispTutor([]);
      setLoadingExtra(true);
      setDispModalOpen(true);

      const res = await fetch(`/api/admin/tutores/${t.id}/disponibilidad`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Error al cargar disponibilidad.");
      }
      setDispTutor(data.disponibilidad || []);
    } catch (err: any) {
      setError(err.message || "Error al cargar disponibilidad del tutor.");
    } finally {
      setLoadingExtra(false);
    }
  };

  return (
    <>
      {/* Búsqueda + nuevo tutor */}
      <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-xs">
          <span className="pointer-events-none absolute inset-y-0 left-2 flex items-center">
            <MagnifyingGlassIcon className="h-4 w-4 text-slate-400" />
          </span>
          <input
            type="text"
            placeholder="Buscar por nombre o email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border border-slate-300 bg-white pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-1 rounded-full bg-indigo-600 text-white px-3 py-1.5 text-xs font-medium hover:bg-indigo-700 shadow-sm"
        >
          <PlusIcon className="h-4 w-4" />
          Nuevo tutor
        </button>
      </section>

      {/* Grid de tarjetas */}
      <section className="mt-3">
        {filtered.length === 0 ? (
          <p className="text-xs text-slate-500">
            No se encontraron tutores con el criterio indicado.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((t) => (
              <article
                key={t.id}
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
                  <p className="text-xs font-semibold text-slate-900">
                    {t.nombre} {t.apellido}
                  </p>
                  <p className="text-[11px] text-slate-500">{t.email}</p>
                  <p className="text-[11px] text-indigo-700 mt-0.5">
                    Rol: {t.rol}
                  </p>
                </div>

                <div className="mb-3 text-[11px] text-slate-500 space-y-1">
                  <p>
                    Teléfono:{" "}
                    <span className="text-slate-800">
                      {t.telefono || "No registrado"}
                    </span>
                  </p>
                  <p>
                    Carrera:{" "}
                    <span className="text-slate-800">
                      {t.carrera || "No registrada"}
                    </span>
                  </p>
                  <p>
                    Zoom:{" "}
                    <span className="text-slate-800">
                      {t.link_zoom || "No registrado"}
                    </span>
                  </p>
                </div>

                <div className="mt-auto space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => openEditModal(t)}
                      className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white text-slate-700 px-3 py-1 text-[11px] font-medium hover:bg-slate-50"
                    >
                      <PencilIcon className="h-3 w-3" />
                      Ver / editar
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(t)}
                      disabled={deletingId === t.id}
                      className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 text-[11px] font-medium text-red-600 px-3 py-1 hover:bg-red-100 disabled:opacity-60"
                    >
                      <TrashIcon className="h-3 w-3" />
                      {deletingId === t.id ? "Eliminando…" : "Eliminar"}
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => openMateriasModal(t)}
                      className="inline-flex items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 text-[11px] font-medium text-indigo-700 px-3 py-1 hover:bg-indigo-100"
                    >
                      <BookOpenIcon className="h-3 w-3" />
                      Materias
                    </button>

                    <button
                      type="button"
                      onClick={() => openDispModal(t)}
                      className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 text-[11px] font-medium text-sky-700 px-3 py-1 hover:bg-sky-100"
                    >
                      <CalendarDaysIcon className="h-3 w-3" />
                      Disponibilidad
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* MODAL crear / editar tutor */}
      {modalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-900">
                {modalMode === "create"
                  ? "Crear nuevo tutor"
                  : "Detalles del tutor"}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-xs text-slate-500 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <form className="grid gap-3 text-xs" onSubmit={handleSubmit}>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 text-slate-600">Nombre</label>
                  <input
                    type="text"
                    name="nombre"
                    value={form.nombre}
                    onChange={handleChangeForm}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block mb-1 text-slate-600">Apellido</label>
                  <input
                    type="text"
                    name="apellido"
                    value={form.apellido}
                    onChange={handleChangeForm}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1 text-slate-600">Email</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChangeForm}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 text-slate-600">Teléfono</label>
                  <input
                    type="text"
                    name="telefono"
                    value={form.telefono}
                    onChange={handleChangeForm}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block mb-1 text-slate-600">Enlace Zoom</label>
                  <input
                    type="text"
                    name="link_zoom"
                    value={form.link_zoom}
                    onChange={handleChangeForm}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="https://zoom.us/..."
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1 text-slate-600">Carrera</label>
                <input
                  type="text"
                  name="carrera"
                  value={form.carrera}
                  onChange={handleChangeForm}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Ej: Ing. en Electrónica"
                />
              </div>

              <div>
                <label className="block mb-1 text-slate-600">
                  Descripción / Bio
                </label>
                <textarea
                  name="descripcion"
                  value={form.descripcion}
                  onChange={handleChangeForm}
                  rows={3}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Experiencia, enfoque de tutoría, etc."
                />
              </div>

              <div className="mt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-md border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-md bg-indigo-600 text-white px-4 py-2 text-xs font-medium hover:bg-indigo-700 disabled:opacity-60"
                >
                  {saving
                    ? "Guardando…"
                    : modalMode === "create"
                    ? "Crear tutor"
                    : "Guardar cambios"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL Materias del tutor */}
      {materiasModalOpen && tutorActual && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40">
          <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-900">
                Materias de {tutorActual.nombre} {tutorActual.apellido}
              </h3>
              <button
                type="button"
                onClick={() => setMateriasModalOpen(false)}
                className="text-xs text-slate-500 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            {loadingExtra ? (
              <p className="text-xs text-slate-500">Cargando materias…</p>
            ) : materiasTutor.length === 0 ? (
              <p className="text-xs text-slate-500">
                Este tutor aún no tiene materias asignadas.
              </p>
            ) : (
              <div className="space-y-3 text-xs">
                {materiasTutor.map((m) => (
                  <div
                    key={m.id}
                    className="rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-2"
                  >
                    <p className="font-semibold text-indigo-900">
                      {m.nombre}
                    </p>
                    {m.semestres && (
                      <p className="text-[11px] text-indigo-700">
                        Semestres: {m.semestres}
                      </p>
                    )}
                    {m.descripcion && (
                      <p className="mt-1 text-[11px] text-slate-700">
                        {m.descripcion}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL Disponibilidad */}
      {dispModalOpen && tutorActual && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40">
          <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-900">
                Disponibilidad de {tutorActual.nombre} {tutorActual.apellido}
              </h3>
              <button
                type="button"
                onClick={() => setDispModalOpen(false)}
                className="text-xs text-slate-500 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            {loadingExtra ? (
              <p className="text-xs text-slate-500">Cargando disponibilidad…</p>
            ) : dispTutor.length === 0 ? (
              <p className="text-xs text-slate-500">
                Este tutor aún no ha registrado disponibilidad.
              </p>
            ) : (
              <div className="space-y-2 text-xs">
                {dispTutor.map((d) => (
                  <div
                    key={d.id}
                    className="rounded-lg border border-sky-100 bg-sky-50 px-3 py-2 flex justify-between"
                  >
                    <span className="font-semibold text-sky-800">
                      {d.dia_semana}
                    </span>
                    <span className="text-sky-900">
                      {d.hora_inicio.slice(0, 5)} - {d.hora_fin.slice(0, 5)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TOASTS flotantes */}
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
