"use client";

import { useEffect, useState } from "react";
import TutorPerfilForm from "@/components/tutor/TutorPerfilForm";

type PerfilTutor = {
  tutorId: number;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string | null;
  carrera: string | null;
  descripcion: string | null;
  linkZoom: string | null;
};

export default function TutorPerfilPage() {
  const [perfil, setPerfil] = useState<PerfilTutor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cargarPerfil = async () => {
      try {
        if (typeof window === "undefined") return;

        const raw = localStorage.getItem("user");
        if (!raw) {
          setError("No hay usuario autenticado.");
          setLoading(false);
          return;
        }

        const user = JSON.parse(raw) as {
          id: number;
          nombre: string;
          apellido: string;
          email: string;
          rol: string;
        };

        if (user.rol !== "TUTOR") {
          setError("Solo los tutores tienen perfil de tutor.");
          setLoading(false);
          return;
        }

        const res = await fetch(`/api/tutor/perfil?tutorId=${user.id}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data?.message || "Error al cargar el perfil");
        }

        setPerfil(data.perfil as PerfilTutor);
      } catch (err: any) {
        setError(err.message || "Ocurrió un error al cargar el perfil.");
      } finally {
        setLoading(false);
      }
    };

    cargarPerfil();
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5 max-w-xl text-xs">
        <p className="text-slate-500 text-xs">Cargando perfil...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5 max-w-xl text-xs">
        <p className="text-red-600 text-xs">{error}</p>
      </div>
    );
  }

  if (!perfil) {
    return (
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5 max-w-xl text-xs">
        <p className="text-slate-500 text-xs">
          No se pudo cargar la información del perfil.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5 max-w-xl text-xs">
      <h2 className="text-sm font-semibold text-slate-900 mb-4">
        Mi perfil como tutor
      </h2>

      <TutorPerfilForm
        tutorId={perfil.tutorId}
        nombre={perfil.nombre}
        apellido={perfil.apellido}
        email={perfil.email}
        telefono={perfil.telefono}
        carrera={perfil.carrera}
        descripcion={perfil.descripcion}
        linkZoom={perfil.linkZoom}
      />
    </div>
  );
}
