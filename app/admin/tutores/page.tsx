import pool from "@/lib/db";
import TutoresAdminClient from "@/components/admin/TutoresAdminClient";

export const dynamic = "force-dynamic";

async function getTutores() {
  const [rows] = await pool.query(
    `
    SELECT 
      u.id,
      u.nombre,
      u.apellido,
      u.email,
      u.rol,
      u.imagen_perfil,
      t.telefono,
      t.carrera,
      t.descripcion,
      t.link_zoom
    FROM usuarios u
    LEFT JOIN tutores t ON t.usuario_id = u.id
    WHERE u.rol = 'TUTOR'
    ORDER BY u.apellido, u.nombre
    `
  );

  return rows as any[];
}

export default async function AdminTutoresPage() {
  const tutores = await getTutores();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">
          Gestión de tutores
        </h1>
        <p className="text-xs text-slate-500">
          Administra los tutores registrados, sus datos, materias y disponibilidad.
        </p>
      </div>

      <TutoresAdminClient initialTutores={tutores} />
    </div>
  );
}
