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
        id,
        dia_semana,
        hora_inicio,
        hora_fin
      FROM disponibilidad_tutor
      WHERE tutor_id = ?
      ORDER BY FIELD(dia_semana,
        'LUNES','MARTES','MIERCOLES','JUEVES','VIERNES','SABADO','DOMINGO'),
        hora_inicio
      `,
      [tutorId]
    );

    return NextResponse.json({ disponibilidad: rows });
  } catch (err: any) {
    console.error("Error GET disponibilidad tutor:", err);
    return NextResponse.json(
      { message: "Error al obtener disponibilidad del tutor." },
      { status: 500 }
    );
  }
}
