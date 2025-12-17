import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import type { RowDataPacket } from "mysql2";

type Row = RowDataPacket & {
  id: number;
  fecha_hora_inicio: string;
  fecha_hora_fin: string;
  modalidad: "PRESENCIAL" | "VIRTUAL";
  estado: "PENDIENTE" | "ACEPTADA" | "RECHAZADA" | "COMPLETADA" | "CANCELADA";
  comentario_estudiante: string | null;
  calificacion: number | null;

  tutor_nombre: string;
  tutor_apellido: string;
  tutor_carrera: string | null;
  tutor_link_zoom: string | null;

  materia_nombre: string;
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const estudianteId = Number(searchParams.get("estudianteId"));

    if (!estudianteId) {
      return NextResponse.json({ message: "estudianteId es requerido" }, { status: 400 });
    }

    const [rows] = await pool.query<Row[]>(
      `
      SELECT
        s.id, s.fecha_hora_inicio, s.fecha_hora_fin, s.modalidad, s.estado,
        s.comentario_estudiante, s.calificacion,
        u.nombre AS tutor_nombre, u.apellido AS tutor_apellido,
        t.carrera AS tutor_carrera, t.link_zoom AS tutor_link_zoom,
        m.nombre AS materia_nombre
      FROM sesiones_tutoria s
      INNER JOIN usuarios u ON u.id = s.tutor_id
      LEFT JOIN tutores t ON t.usuario_id = s.tutor_id
      INNER JOIN materias m ON m.id = s.materia_id
      WHERE s.estudiante_id = ?
      ORDER BY s.fecha_hora_inicio DESC
      `,
      [estudianteId]
    );

    return NextResponse.json({ sesiones: rows }, { status: 200 });
  } catch (error: any) {
    console.error("Error sesiones:", error);
    return NextResponse.json({ message: "Error interno", detail: error?.message }, { status: 500 });
  }
}
