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
        id,
        tutor_id,
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
      { message: "Error al obtener disponibilidad." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      tutorId,
      dia_semana,
      hora_inicio,
      hora_fin,
    }: {
      tutorId: number;
      dia_semana: string;
      hora_inicio: string;
      hora_fin: string;
    } = body;

    if (!tutorId || !dia_semana || !hora_inicio || !hora_fin) {
      return NextResponse.json(
        { message: "Todos los campos son obligatorios." },
        { status: 400 }
      );
    }

    // Validación básica de rango
    if (hora_fin <= hora_inicio) {
      return NextResponse.json(
        { message: "La hora fin debe ser mayor que la hora inicio." },
        { status: 400 }
      );
    }

    const [result]: any = await pool.query(
      `
      INSERT INTO disponibilidad_tutor (tutor_id, dia_semana, hora_inicio, hora_fin)
      VALUES (?, ?, ?, ?)
      `,
      [tutorId, dia_semana, hora_inicio, hora_fin]
    );

    const insertedId = result.insertId as number;

    const [rows] = await pool.query(
      `
      SELECT 
        id,
        tutor_id,
        dia_semana,
        hora_inicio,
        hora_fin
      FROM disponibilidad_tutor
      WHERE id = ?
      `,
      [insertedId]
    );

    const row = Array.isArray(rows) ? rows[0] : rows;

    return NextResponse.json({ disponibilidad: row }, { status: 201 });
  } catch (err: any) {
    console.error("Error POST disponibilidad tutor:", err);
    return NextResponse.json(
      { message: "Error al crear franja de disponibilidad." },
      { status: 500 }
    );
  }
}
