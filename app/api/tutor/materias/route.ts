import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tutorIdParam = searchParams.get("tutorId");

    const tutorId = tutorIdParam ? Number(tutorIdParam) : NaN;

    if (!tutorId || Number.isNaN(tutorId)) {
      return NextResponse.json(
        { message: "tutorId inválido o no proporcionado." },
        { status: 400 }
      );
    }

    const [rows] = await pool.query(
      `
      SELECT 
        m.id,
        m.nombre,
        m.descripcion,
        GROUP_CONCAT(ms.semestre ORDER BY ms.semestre SEPARATOR ', ') AS semestres
      FROM tutor_materia tm
      JOIN materias m ON m.id = tm.materia_id
      LEFT JOIN materia_semestre ms ON ms.materia_id = m.id
      WHERE tm.tutor_id = ?
      GROUP BY m.id, m.nombre, m.descripcion
      ORDER BY m.nombre
      `,
      [tutorId]
    );

    return NextResponse.json({ materias: rows });
  } catch (err: any) {
    console.error("Error GET /api/tutor/materias:", err);
    return NextResponse.json(
      { message: "Error al obtener materias del tutor." },
      { status: 500 }
    );
  }
}
