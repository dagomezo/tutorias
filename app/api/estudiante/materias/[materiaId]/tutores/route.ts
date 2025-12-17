import { NextResponse } from "next/server";
import pool from "@/lib/db";
import type { RowDataPacket } from "mysql2";

interface MateriaRow extends RowDataPacket {
  id: number;
  nombre: string;
}

interface TutorRow extends RowDataPacket {
  tutor_id: number;
  nombre: string;
  apellido: string;
  carrera: string | null;
  imagen_perfil: string | null;
  calificacion_promedio: number | null;
}

// params también llega como Promise en Next 16
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ materiaId: string }> }
) {
  const { materiaId } = await params;
  const materiaIdNum = Number(materiaId);

  if (!materiaId || Number.isNaN(materiaIdNum)) {
    // devolvemos vacío para no romper la vista
    return NextResponse.json({ materia: null, tutores: [] });
  }

  try {
    const conn = await pool.getConnection();

    // 1️⃣ Materia
    const [materiaRows] = await conn.query<MateriaRow[]>(
      "SELECT id, nombre FROM materias WHERE id = ? LIMIT 1",
      [materiaIdNum]
    );

    const materia =
      materiaRows.length > 0
        ? { id: materiaRows[0].id, nombre: materiaRows[0].nombre }
        : null;

    // 2️⃣ Tutores para esa materia
    const [tutorRows] = await conn.query<TutorRow[]>(
      `
      SELECT
        u.id AS tutor_id,
        u.nombre,
        u.apellido,
        t.carrera,
        u.imagen_perfil,
        AVG(st.calificacion) AS calificacion_promedio
      FROM tutor_materia tm
      JOIN usuarios u     ON u.id = tm.tutor_id
      LEFT JOIN tutores t ON t.usuario_id = u.id
      LEFT JOIN sesiones_tutoria st
        ON st.tutor_id   = u.id
       AND st.materia_id = tm.materia_id
       AND st.calificacion IS NOT NULL
      WHERE tm.materia_id = ?
      GROUP BY
        u.id, u.nombre, u.apellido, t.carrera, u.imagen_perfil
      ORDER BY u.apellido, u.nombre
    `,
      [materiaIdNum]
    );

    conn.release();

    const tutores = tutorRows.map((row) => ({
      id: row.tutor_id,
      nombre: row.nombre,
      apellido: row.apellido,
      carrera: row.carrera ?? "",
      imagen_perfil: row.imagen_perfil,
      modalidad_presencial: true,
      modalidad_virtual: true,
      calificacion_promedio: row.calificacion_promedio,
    }));

    return NextResponse.json({ materia, tutores });
  } catch (err) {
    console.error(
      "ERROR /api/estudiante/materias/[materiaId]/tutores:",
      err
    );
    return NextResponse.json({ materia: null, tutores: [] });
  }
}
