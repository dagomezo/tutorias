import pool from "@/lib/db";
import MateriasAdminClient from "@/components/admin/MateriasAdminClient";

export const dynamic = "force-dynamic";

type MateriaRow = {
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

async function getMaterias(): Promise<MateriaRow[]> {
  const [rows] = await pool.query(
    `
    SELECT
      m.id,
      m.nombre,
      m.descripcion,
      GROUP_CONCAT(ms.semestre ORDER BY ms.semestre SEPARATOR ', ') AS semestres,
      (
        SELECT tm.tutor_id
        FROM tutor_materia tm
        WHERE tm.materia_id = m.id
        LIMIT 1
      ) AS tutorId,
      (
        SELECT CONCAT(u.nombre, ' ', u.apellido)
        FROM tutor_materia tm2
        JOIN tutores t ON t.usuario_id = tm2.tutor_id
        JOIN usuarios u ON u.id = t.usuario_id
        WHERE tm2.materia_id = m.id
        ORDER BY u.apellido, u.nombre
        LIMIT 1
      ) AS tutorNombre
    FROM materias m
    LEFT JOIN materia_semestre ms ON ms.materia_id = m.id
    GROUP BY m.id, m.nombre, m.descripcion
    ORDER BY m.nombre
    `
  );

  return rows as MateriaRow[];
}

async function getTutoresOptions(): Promise<TutorOption[]> {
  const [rows] = await pool.query(
    `
    SELECT 
      u.id,
      CONCAT(u.nombre, ' ', u.apellido) AS nombreCompleto
    FROM usuarios u
    JOIN tutores t ON t.usuario_id = u.id
    WHERE u.rol = 'TUTOR'
    ORDER BY u.apellido, u.nombre
    `
  );

  return rows as TutorOption[];
}

export default async function AdminMateriasPage() {
  const [materias, tutoresOptions] = await Promise.all([
    getMaterias(),
    getTutoresOptions(),
  ]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">
          Gestión de materias y semestres
        </h1>
        <p className="text-xs text-slate-500">
          Administra las materias, su descripción, el tutor asignado y los semestres en los que se dictan.
        </p>
      </div>

      <MateriasAdminClient
        initialMaterias={materias}
        tutoresOptions={tutoresOptions}
      />
    </div>
  );
}
