"use client";

import { FormEvent, useState } from "react";
import { PencilSquareIcon } from "@heroicons/react/24/outline";

type TutorPerfilFormProps = {
  tutorId: number;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string | null;
  carrera: string | null;
  descripcion: string | null;
  linkZoom: string | null;
};

export default function TutorPerfilForm({
  tutorId,
  nombre,
  apellido,
  email,
  telefono,
  carrera,
  descripcion,
  linkZoom,
}: TutorPerfilFormProps) {
  const safeNombre = nombre ?? "";
  const safeApellido = apellido ?? "";

  const iniciales =
    ((safeNombre[0] || "") + (safeApellido[0] || "") || "T").toUpperCase();

  const [form, setForm] = useState({
    telefono: telefono ?? "",
    carrera: carrera ?? "",
    descripcion: descripcion ?? "",
    linkZoom: linkZoom ?? "",
  });

  const [saved, setSaved] = useState({
    telefono: telefono ?? "",
    carrera: carrera ?? "",
    descripcion: descripcion ?? "",
    linkZoom: linkZoom ?? "",
  });

  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  const isNuevoPerfil =
    !saved.telefono && !saved.carrera && !saved.descripcion && !saved.linkZoom;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditToggle = () => {
    if (editing) {
      setForm({ ...saved });
      setMensaje(null);
      setError(null);
      setEditing(false);
    } else {
      setMensaje(null);
      setError(null);
      setEditing(true);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editing) return;

    setLoading(true);
    setMensaje(null);
    setError(null);

    try {
      const res = await fetch("/api/tutor/perfil", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tutorId,
          telefono: form.telefono,
          carrera: form.carrera,
          descripcion: form.descripcion,
          linkZoom: form.linkZoom,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Error al guardar");
      }

      const perfil = data.perfil;
      setSaved({
        telefono: perfil?.telefono ?? form.telefono,
        carrera: perfil?.carrera ?? form.carrera,
        descripcion: perfil?.descripcion ?? form.descripcion,
        linkZoom: perfil?.linkZoom ?? form.linkZoom,
      });

      setMensaje("Información de perfil guardada correctamente.");
      setEditing(false);
    } catch (err: any) {
      setError(err.message || "Ocurrió un error al guardar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {/* TARJETA */}
      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="h-14 w-14 rounded-full bg-indigo-500 text-white flex items-center justify-center font-semibold text-lg">
              {iniciales}
            </div>
            <div>
              <p className="font-semibold text-slate-900 text-base">
                {safeNombre} {safeApellido}
              </p>
              <p className="text-xs text-slate-600">{email}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleEditToggle}
            className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
          >
            <PencilSquareIcon className="h-4 w-4" />
            {editing ? "Cancelar" : isNuevoPerfil ? "Agregar info" : "Editar"}
          </button>
        </div>

        {/* Campos */}
        <div className="space-y-4 text-sm">
          {/* Teléfono */}
          <div>
            <p className="text-[11px] uppercase font-semibold text-slate-500 tracking-wide">
              Teléfono
            </p>
            {editing ? (
              <input
                type="text"
                name="telefono"
                value={form.telefono}
                onChange={handleChange}
                className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm text-slate-900 placeholder-slate-400 bg-white"
                placeholder="Ej: 0999999999"
              />
            ) : (
              <p className="mt-0.5 text-slate-800">
                {saved.telefono || "No registrado"}
              </p>
            )}
          </div>

          {/* Carrera */}
          <div>
            <p className="text-[11px] uppercase font-semibold text-slate-500 tracking-wide">
              Carrera
            </p>
            {editing ? (
              <input
                type="text"
                name="carrera"
                value={form.carrera}
                onChange={handleChange}
                className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm text-slate-900 placeholder-slate-400 bg-white"
                placeholder="Ej: Ingeniería en Electrónica"
              />
            ) : (
              <p className="mt-0.5 text-slate-800">
                {saved.carrera || "No registrada"}
              </p>
            )}
          </div>

          {/* Zoom */}
          <div>
            <p className="text-[11px] uppercase font-semibold text-slate-500 tracking-wide">
              Enlace de Zoom
            </p>
            {editing ? (
              <input
                type="text"
                name="linkZoom"
                value={form.linkZoom}
                onChange={handleChange}
                className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm text-slate-900 placeholder-slate-400 bg-white"
                placeholder="https://zoom.us/..."
              />
            ) : (
              <p className="mt-0.5 text-slate-800 break-all">
                {saved.linkZoom || "No registrado"}
              </p>
            )}
          </div>

          {/* Descripción */}
          <div>
            <p className="text-[11px] uppercase font-semibold text-slate-500 tracking-wide">
              Descripción / Bio
            </p>
            {editing ? (
              <textarea
                name="descripcion"
                value={form.descripcion}
                onChange={handleChange}
                rows={3}
                className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm text-slate-900 placeholder-slate-400 bg-white"
                placeholder="Cuenta tu experiencia, enfoque de tutoría, etc."
              />
            ) : (
              <p className="mt-0.5 text-slate-800 whitespace-pre-line">
                {saved.descripcion || "Sin descripción aún."}
              </p>
            )}
          </div>
        </div>
      </div>

      {mensaje && (
        <div className="rounded-md bg-emerald-50 text-emerald-700 px-3 py-2 text-xs">
          {mensaje}
        </div>
      )}
      {error && (
        <div className="rounded-md bg-red-50 text-red-700 px-3 py-2 text-xs">
          {error}
        </div>
      )}

      {editing && (
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-indigo-600 text-white px-4 py-2 text-xs font-medium hover:bg-indigo-700 disabled:opacity-60"
        >
          {loading ? "Guardando..." : "Guardar cambios"}
        </button>
      )}
    </form>
  );
}
