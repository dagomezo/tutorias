"use client";

import { useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import {
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import Toast from "@/components/ui/Toast";

type EstudianteAdmin = {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  rol: string;
  imagen_perfil: string | null;
  cedula: string | null;
  telefono: string | null;
  carrera: string | null;
  ciclo: string | null;
};

type Props = {
  initialEstudiantes: EstudianteAdmin[];
};

type ModalMode = "create" | "edit";

export default function EstudiantesAdminClient({ initialEstudiantes }: Props) {
  const [estudiantes, setEstudiantes] =
    useState<EstudianteAdmin[]>(initialEstudiantes);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>("create");
  const [form, setForm] = useState({
    id: 0,
    nombre: "",
    apellido: "",
    email: "",
    cedula: "",
    telefono: "",
    carrera: "",
    ciclo: "",
  });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return estudiantes;
    return estudiantes.filter((e) => {
      return (
        e.nombre.toLowerCase().includes(q) ||
        e.apellido.toLowerCase().includes(q) ||
        e.email.toLowerCase().includes(q) ||
        (e.cedula ?? "").toLowerCase().includes(q)
      );
    });
  }, [search, estudiantes]);

  const openCreateModal = () => {
    setForm({
      id: 0,
      nombre: "",
      apellido: "",
      email: "",
      cedula: "",
      telefono: "",
      carrera: "",
      ciclo: "",
    });
    setModalMode("create");
    setMensaje(null);
    setError(null);
    setModalOpen(true);
  };

  const openEditModal = (e: EstudianteAdmin) => {
    setForm({
      id: e.id,
      nombre: e.nombre,
      apellido: e.apellido,
      email: e.email,
      cedula: e.cedula || "",
      telefono: e.telefono || "",
      carrera: e.carrera || "",
      ciclo: e.ciclo || "",
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
      if (!form.nombre || !form.apellido || !form.email || !form.cedula) {
        throw new Error(
          "Nombre, apellido, email y cédula son obligatorios."
        );
      }

      if (modalMode === "create") {
        const res = await fetch("/api/admin/estudiantes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nombre: form.nombre.trim(),
            apellido: form.apellido.trim(),
            email: form.email.trim(),
            cedula: form.cedula.trim(),
            telefono: form.telefono.trim() || null,
            carrera: form.carrera.trim() || null,
            ciclo: form.ciclo.trim() || null,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data?.message || "Error al crear estudiante.");
        }

        setEstudiantes((prev) => [
          ...prev,
          data.estudiante as EstudianteAdmin,
        ]);
        setMensaje("Estudiante creado correctamente.");
        setModalOpen(false);
      } else {
        // EDIT
        const res = await fetch(`/api/admin/estudiantes/${form.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nombre: form.nombre.trim(),
            apellido: form.apellido.trim(),
            email: form.email.trim(),
            cedula: form.cedula.trim(),
            telefono: form.telefono.trim() || null,
            carrera: form.carrera.trim() || null,
            ciclo: form.ciclo.trim() || null,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(
            data?.message || "Error al actualizar estudiante."
          );
        }

        setEstudiantes((prev) =>
          prev.map((e) =>
            e.id === form.id ? (data.estudiante as EstudianteAdmin) : e
          )
        );
        setMensaje("Estudiante actualizado correctamente.");
        setModalOpen(false);
      }
    } catch (err: any) {
      setError(err.message || "Ocurrió un error al guardar.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (e: EstudianteAdmin) => {
    if (!confirm(`¿Eliminar al estudiante "${e.nombre} ${e.apellido}"?`)) {
      return;
    }

    try {
      setDeletingId(e.id);
      setMensaje(null);
      setError(null);

      const res = await fetch(`/api/admin/estudiantes/${e.id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "Error al eliminar estudiante.");
      }

      setEstudiantes((prev) => prev.filter((x) => x.id !== e.id));
      setMensaje("Estudiante eliminado correctamente.");
    } catch (err: any) {
      setError(err.message || "Ocurrió un error al eliminar.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      {/* Barra de búsqueda + botón crear */}
      <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-xs">
          <span className="pointer-events-none absolute inset-y-0 left-2 flex items-center">
            <MagnifyingGlassIcon className="h-4 w-4 text-slate-400" />
          </span>
          <input
            type="text"
            placeholder="Buscar por nombre, email o cédula…"
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
          Nuevo estudiante
        </button>
      </section>

      {/* Grid de tarjetas */}
      <section className="mt-3">
        {filtered.length === 0 ? (
          <p className="text-xs text-slate-500">
            No se encontraron estudiantes con el criterio indicado.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((e) => (
              <article
                key={e.id}
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
                    {e.nombre} {e.apellido}
                  </p>
                  <p className="text-[11px] text-slate-500">{e.email}</p>
                  <p className="text-[11px] text-indigo-700 mt-0.5">
                    Rol: {e.rol}
                  </p>
                </div>

                <div className="mb-3 text-[11px] text-slate-500">
                  <p>
                    Cédula:{" "}
                    <span className="text-slate-800">
                      {e.cedula || "No registrada"}
                    </span>
                  </p>
                  <p>
                    Teléfono:{" "}
                    <span className="text-slate-800">
                      {e.telefono || "No registrado"}
                    </span>
                  </p>
                  <p>
                    Carrera:{" "}
                    <span className="text-slate-800">
                      {e.carrera || "No registrada"}
                    </span>
                  </p>
                  <p>
                    Ciclo:{" "}
                    <span className="text-slate-800">
                      {e.ciclo || "No registrado"}
                    </span>
                  </p>
                </div>

                <div className="mt-auto flex items-center justify-between pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => openEditModal(e)}
                    className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white text-slate-700 px-3 py-1 text-[11px] font-medium hover:bg-slate-50"
                  >
                    <PencilIcon className="h-3 w-3" />
                    Ver / editar
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(e)}
                    disabled={deletingId === e.id}
                    className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 text-[11px] font-medium text-red-600 px-3 py-1 hover:bg-red-100 disabled:opacity-60"
                  >
                    <TrashIcon className="h-3 w-3" />
                    {deletingId === e.id ? "Eliminando…" : "Eliminar"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* MODAL de detalles / crear */}
      {modalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-900">
                {modalMode === "create"
                  ? "Crear nuevo estudiante"
                  : "Detalles del estudiante"}
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

              <div>
                <label className="block mb-1 text-slate-600">Cédula</label>
                <input
                  type="text"
                  name="cedula"
                  value={form.cedula}
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
                  <label className="block mb-1 text-slate-600">Ciclo</label>
                  <input
                    type="text"
                    name="ciclo"
                    value={form.ciclo}
                    onChange={handleChangeForm}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Ej: 3er semestre"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1 text-slate-600">Carrera</label>
                <textarea
                  name="carrera"
                  value={form.carrera}
                  onChange={handleChangeForm}
                  rows={2}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Ej: Ingeniería Electrónica"
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
                    ? "Crear estudiante"
                    : "Guardar cambios"}
                </button>
              </div>
            </form>
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
