import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params; // 👈 AQUÍ el await
    const tutorId = Number(id);

    if (Number.isNaN(tutorId)) {
      return NextResponse.json(
        { message: "ID de tutor inválido." },
        { status: 400 }
      );
    }

    const [rows] = await pool.query(
      `
      SELECT 
        tm.id,
        m.id AS materiaId,
        m.nombre,
        m.descripcion,
        GROUP_CONCAT(ms.semestre ORDER BY ms.semestre SEPARATOR ', ') AS semestres
      FROM tutor_materia tm
      JOIN materias m ON m.id = tm.materia_id
      LEFT JOIN materia_semestre ms ON ms.materia_id = m.id
      WHERE tm.tutor_id = ?
      GROUP BY tm.id, m.id, m.nombre, m.descripcion
      ORDER BY m.nombre
      `,
      [tutorId]
    );

    return NextResponse.json({ materias: rows });
  } catch (err: any) {
    console.error("Error GET materias tutor:", err);
    return NextResponse.json(
      { message: "Error al obtener materias del tutor." },
      { status: 500 }
    );
  }
}
