"use client";

import {
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import {
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import Toast from "@/components/ui/Toast";

type MateriaAdmin = {
  id: number;
  nombre: string;
  descripcion: string | null;
  semestres: string | null;
  tutorId: number | null;
  tutorNombre: string | null;
};

type TutorOption = {
  id: number;
  nombreCompleto: string;
};

type Props = {
  initialMaterias: MateriaAdmin[];
  tutoresOptions: TutorOption[];
};

type ModalMode = "create" | "edit";

export default function MateriasAdminClient({
  initialMaterias,
  tutoresOptions,
}: Props) {
  const [materias, setMaterias] = useState<MateriaAdmin[]>(initialMaterias);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>("create");
  const [form, setForm] = useState({
    id: 0,
    nombre: "",
    descripcion: "",
    semestresTexto: "",
    tutorId: "",
  });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return materias;
    return materias.filter((m) => {
      return (
        m.nombre.toLowerCase().includes(q) ||
        (m.descripcion ?? "").toLowerCase().includes(q) ||
        (m.semestres ?? "").toLowerCase().includes(q) ||
        (m.tutorNombre ?? "").toLowerCase().includes(q)
      );
    });
  }, [search, materias]);

  const openCreateModal = () => {
    setForm({
      id: 0,
      nombre: "",
      descripcion: "",
      semestresTexto: "",
      tutorId: "",
    });
    setModalMode("create");
    setMensaje(null);
    setError(null);
    setModalOpen(true);
  };

  const openEditModal = (m: MateriaAdmin) => {
    setForm({
      id: m.id,
      nombre: m.nombre,
      descripcion: m.descripcion ?? "",
      semestresTexto: m.semestres ?? "",
      tutorId: m.tutorId ? String(m.tutorId) : "",
    });
    setModalMode("edit");
    setMensaje(null);
    setError(null);
    setModalOpen(true);
  };

  const handleChangeForm = (
    ev: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
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
      if (!form.nombre.trim()) {
        throw new Error("El nombre de la materia es obligatorio.");
      }

      const semestresArr = form.semestresTexto
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const tutorIdNum =
        form.tutorId && form.tutorId.trim() !== ""
          ? Number(form.tutorId)
          : null;

      if (modalMode === "create") {
        const res = await fetch("/api/admin/materias", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nombre: form.nombre.trim(),
            descripcion: form.descripcion.trim() || null,
            semestres: semestresArr,
            tutorId: tutorIdNum,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data?.message || "Error al crear materia.");
        }

        setMaterias((prev) => [...prev, data.materia as MateriaAdmin]);
        setMensaje("Materia creada correctamente.");
        setModalOpen(false);
      } else {
        const res = await fetch(`/api/admin/materias/${form.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nombre: form.nombre.trim(),
            descripcion: form.descripcion.trim() || null,
            semestres: semestresArr,
            tutorId: tutorIdNum,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(
            data?.message || "Error al actualizar la materia."
          );
        }

        setMaterias((prev) =>
          prev.map((m) =>
            m.id === form.id ? (data.materia as MateriaAdmin) : m
          )
        );
        setMensaje("Materia actualizada correctamente.");
        setModalOpen(false);
      }
    } catch (err: any) {
      setError(err.message || "Ocurrió un error al guardar la materia.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (m: MateriaAdmin) => {
    if (!confirm(`¿Eliminar la materia "${m.nombre}"?`)) return;

    try {
      setDeletingId(m.id);
      setMensaje(null);
      setError(null);

      const res = await fetch(`/api/admin/materias/${m.id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          data?.message ||
            "Error al eliminar la materia. Puede tener tutorías asociadas."
        );
      }

      setMaterias((prev) => prev.filter((x) => x.id !== m.id));
      setMensaje("Materia eliminada correctamente.");
    } catch (err: any) {
      setError(err.message || "Ocurrió un error al eliminar la materia.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      {/* Búsqueda + nuevo */}
      <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-xs">
          <span className="pointer-events-none absolute inset-y-0 left-2 flex items-center">
            <MagnifyingGlassIcon className="h-4 w-4 text-slate-400" />
          </span>
          <input
            type="text"
            placeholder="Buscar por nombre, descripción, tutor o semestre…"
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
          Nueva materia
        </button>
      </section>

      {/* Grid de materias */}
      <section className="mt-3">
        {filtered.length === 0 ? (
          <p className="text-xs text-slate-500">
            No se encontraron materias con el criterio indicado.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((m) => (
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
                  <p className="text-sm font-semibold text-slate-900">
                    {m.nombre}
                  </p>
                  {m.descripcion && (
                    <p className="mt-1 text-[11px] text-slate-600 line-clamp-3">
                      {m.descripcion}
                    </p>
                  )}
                </div>

                <div className="mb-3 text-[11px] space-y-1">
                  <p className="text-slate-500">
                    Tutor asignado:{" "}
                    <span className="text-slate-800">
                      {m.tutorNombre || "Sin tutor asignado"}
                    </span>
                  </p>
                  <p className="text-slate-500">
                    Semestres:{" "}
                    <span className="text-slate-800">
                      {m.semestres || "No configurados"}
                    </span>
                  </p>
                </div>

                <div className="mt-auto flex items-center justify-between pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => openEditModal(m)}
                    className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white text-slate-700 px-3 py-1 text-[11px] font-medium hover:bg-slate-50"
                  >
                    <PencilIcon className="h-3 w-3" />
                    Ver / editar
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(m)}
                    disabled={deletingId === m.id}
                    className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 text-[11px] font-medium text-red-600 px-3 py-1 hover:bg-red-100 disabled:opacity-60"
                  >
                    <TrashIcon className="h-3 w-3" />
                    {deletingId === m.id ? "Eliminando…" : "Eliminar"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* MODAL crear / editar materia */}
      {modalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-900">
                {modalMode === "create"
                  ? "Crear nueva materia"
                  : "Editar materia"}
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
                <label className="block mb-1 text-slate-600">
                  Descripción
                </label>
                <textarea
                  name="descripcion"
                  value={form.descripcion}
                  onChange={handleChangeForm}
                  rows={3}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Breve descripción de la materia…"
                />
              </div>

              <div>
                <label className="block mb-1 text-slate-600">
                  Semestres (separados por coma)
                </label>
                <input
                  type="text"
                  name="semestresTexto"
                  value={form.semestresTexto}
                  onChange={handleChangeForm}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Ej: 1, 2, 3er, 4to"
                />
              </div>

              <div>
                <label className="block mb-1 text-slate-600">
                  Tutor asignado
                </label>
                <select
                  name="tutorId"
                  value={form.tutorId}
                  onChange={handleChangeForm}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Sin tutor asignado</option>
                  {tutoresOptions.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nombreCompleto}
                    </option>
                  ))}
                </select>
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
                    ? "Crear materia"
                    : "Guardar cambios"}
                </button>
              </div>
            </form>
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
