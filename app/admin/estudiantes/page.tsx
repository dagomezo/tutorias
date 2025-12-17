"use client";

import { useEffect, useState } from "react";
import EstudiantesAdminClient from "@/components/admin/EstudiantesAdminClient";

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

export default function AdminEstudiantesPage() {
  const [estudiantes, setEstudiantes] = useState<EstudianteAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cargar = async () => {
      try {
        const res = await fetch("/api/admin/estudiantes");
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data?.message || "Error al cargar estudiantes.");
        }

        setEstudiantes(data.estudiantes as EstudianteAdmin[]);
      } catch (err: any) {
        setError(err.message || "Ocurrió un error al cargar estudiantes.");
      } finally {
        setLoading(false);
      }
    };

    cargar();
  }, []);

  if (loading) {
    return (
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-slate-900">
          Gestión de estudiantes
        </h2>
        <p className="text-xs text-slate-500">Cargando estudiantes…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-slate-900">
          Gestión de estudiantes
        </h2>
        <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">
          {error}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <header>
        <h2 className="text-sm font-semibold text-slate-900">
          Gestión de estudiantes
        </h2>
        <p className="text-xs text-slate-500">
          Administra los estudiantes registrados en el sistema.
        </p>
      </header>

      <EstudiantesAdminClient initialEstudiantes={estudiantes} />
    </div>
  );
}
