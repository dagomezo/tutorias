import pool from "@/lib/db";
import ReportesAdminClient from "@/components/admin/ReportesAdminClient";

export const dynamic = "force-dynamic";

type MateriaReporte = {
  id: number;
  nombre: string;
  totalSesiones: number;
};

type TutorMaloReporte = {
  tutorId: number;
  nombreCompleto: string;
  malas: number;
  promedio: number | null;
};

async function getTopMateriasMasSolicitadas(): Promise<MateriaReporte[]> {
  const [rows] = await pool.query(
    `
    SELECT 
      m.id,
      m.nombre,
      COUNT(*) AS totalSesiones
    FROM sesiones_tutoria s
    JOIN materias m ON m.id = s.materia_id
    -- Si quieres solo COMPLETADAS, descomenta la siguiente línea:
    -- WHERE s.estado = 'COMPLETADA'
    GROUP BY m.id, m.nombre
    ORDER BY totalSesiones DESC
    LIMIT 5
    `
  );

  return (rows as any[]).map((r) => ({
    id: r.id,
    nombre: r.nombre,
    totalSesiones: Number(r.totalSesiones),
  }));
}

async function getTopTutoresMalasCalificaciones(): Promise<TutorMaloReporte[]> {
  const [rows] = await pool.query(
    `
    SELECT 
      t.usuario_id AS tutorId,
      CONCAT(u.nombre, ' ', u.apellido) AS nombreCompleto,
      COUNT(*) AS malas,
      AVG(s.calificacion) AS promedio
    FROM sesiones_tutoria s
    JOIN tutores t ON t.usuario_id = s.tutor_id
    JOIN usuarios u ON u.id = t.usuario_id
    WHERE s.calificacion IS NOT NULL
      AND s.calificacion < 4
    GROUP BY t.usuario_id, u.nombre, u.apellido
    HAVING COUNT(*) >= 3
    ORDER BY malas DESC, promedio ASC
    `
  );

  return (rows as any[]).map((r) => ({
    tutorId: r.tutorId,
    nombreCompleto: r.nombreCompleto,
    malas: Number(r.malas),
    promedio: r.promedio !== null ? Number(r.promedio) : null,
  }));
}

export default async function AdminReportesPage() {
  const [topMaterias, topTutoresMalos] = await Promise.all([
    getTopMateriasMasSolicitadas(),
    getTopTutoresMalasCalificaciones(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">
          Reportes de tutorías
        </h1>
        <p className="text-xs text-slate-500">
          Resumen visual de las materias más solicitadas y tutores con más calificaciones bajas.
        </p>
      </div>

      <ReportesAdminClient
        topMaterias={topMaterias}
        topTutoresMalos={topTutoresMalos}
      />
    </div>
  );
}
