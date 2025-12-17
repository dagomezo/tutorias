import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    const estudianteId = Number(body?.estudianteId);
    const tutorId = Number(body?.tutorId);
    const materiaId = Number(body?.materiaId);

    const nombre_estudiante = String(body?.nombre_estudiante ?? "").trim();
    const cedula_estudiante = String(body?.cedula_estudiante ?? "").trim();
    const comentario = body?.comentario ? String(body.comentario) : null;

    const fecha_hora_inicio = String(body?.fecha_hora_inicio ?? "").trim();
    const fecha_hora_fin = String(body?.fecha_hora_fin ?? "").trim();

    // Por default: VIRTUAL
    const modalidad = (String(body?.modalidad ?? "VIRTUAL").toUpperCase() === "PRESENCIAL"
      ? "PRESENCIAL"
      : "VIRTUAL") as "PRESENCIAL" | "VIRTUAL";

    if (!estudianteId || !tutorId || !materiaId || !nombre_estudiante || !cedula_estudiante) {
      return NextResponse.json({ message: "Faltan campos obligatorios" }, { status: 400 });
    }
    if (!fecha_hora_inicio || !fecha_hora_fin) {
      return NextResponse.json({ message: "Debes seleccionar un horario válido" }, { status: 400 });
    }

    // 1) Crear sesión (PENDIENTE)
    const [sesRes]: any = await pool.query(
      `INSERT INTO sesiones_tutoria
        (estudiante_id, tutor_id, materia_id, fecha_hora_inicio, fecha_hora_fin, modalidad, estado, comentario_estudiante)
       VALUES (?, ?, ?, ?, ?, ?, 'PENDIENTE', ?)`,
      [estudianteId, tutorId, materiaId, fecha_hora_inicio, fecha_hora_fin, modalidad, comentario]
    );

    const sesionId = sesRes.insertId as number;

    // 2) Crear solicitud y linkear a la sesión
    const [solRes]: any = await pool.query(
      `INSERT INTO solicitudes_tutoria
        (estudiante_id, tutor_id, materia_id, sesion_id, nombre_estudiante, cedula_estudiante, comentario, estado)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDIENTE')`,
      [estudianteId, tutorId, materiaId, sesionId, nombre_estudiante, cedula_estudiante, comentario]
    );

    return NextResponse.json(
      {
        message: "Solicitud enviada",
        solicitudId: solRes.insertId,
        sesionId,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creando solicitud:", error);
    return NextResponse.json({ message: "Error interno", detail: error?.message }, { status: 500 });
  }
}
