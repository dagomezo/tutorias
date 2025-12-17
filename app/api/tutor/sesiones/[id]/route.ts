import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const tutorId = Number(id);

    if (!Number.isFinite(tutorId) || tutorId <= 0) {
      return NextResponse.json(
        { message: "Tutor ID inválido", received: id },
        { status: 400 }
      );
    }

    const [rows]: any = await pool.query(
      `
      SELECT
        st.id,
        st.estudiante_id AS estudianteId,
        ue.nombre AS estudianteNombre,
        ue.apellido AS estudianteApellido,
        st.materia_id AS materiaId,
        m.nombre AS materiaNombre,
        st.fecha_hora_inicio AS fechaHoraInicio,
        st.fecha_hora_fin AS fechaHoraFin,
        st.modalidad,
        st.estado,
        st.comentario_estudiante AS comentarioEstudiante,
        st.comentario_tutor AS comentarioTutor,
        st.calificacion,
        st.costo_tutoria AS costoTutoria
      FROM sesiones_tutoria st
      JOIN usuarios ue ON ue.id = st.estudiante_id
      JOIN materias m ON m.id = st.materia_id
      WHERE st.tutor_id = ?
      ORDER BY st.fecha_hora_inicio ASC
      `,
      [tutorId]
    );

    const proximas = (rows || []).filter(
      (s: any) => s.estado === "PENDIENTE" || s.estado === "ACEPTADA"
    );
    const historial = (rows || []).filter(
      (s: any) => s.estado === "COMPLETADA" || s.estado === "CANCELADA"
    );

    return NextResponse.json({ proximas, historial }, { status: 200 });
  } catch (error: any) {
    console.error("Error GET tutor sesiones:", error);
    return NextResponse.json(
      { message: "Error interno", detail: error?.message },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const sesionId = Number(id);

    if (!Number.isFinite(sesionId) || sesionId <= 0) {
      return NextResponse.json(
        { message: "ID inválido", received: id },
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const nuevoEstado = String(body?.nuevoEstado ?? "").trim();

    if (!nuevoEstado) {
      return NextResponse.json(
        { message: "Faltan campos obligatorios (nuevoEstado)" },
        { status: 400 }
      );
    }

    if (nuevoEstado !== "COMPLETADA") {
      return NextResponse.json(
        { message: "Estado no permitido" },
        { status: 400 }
      );
    }

    const [result]: any = await pool.query(
      `UPDATE sesiones_tutoria SET estado = 'COMPLETADA' WHERE id = ?`,
      [sesionId]
    );

    if (!result?.affectedRows) {
      return NextResponse.json(
        { message: "Sesión no encontrada" },
        { status: 404 }
      );
    }

    const [rows]: any = await pool.query(
      `
      SELECT
        st.id,
        st.estudiante_id AS estudianteId,
        ue.nombre AS estudianteNombre,
        ue.apellido AS estudianteApellido,
        st.materia_id AS materiaId,
        m.nombre AS materiaNombre,
        st.fecha_hora_inicio AS fechaHoraInicio,
        st.fecha_hora_fin AS fechaHoraFin,
        st.modalidad,
        st.estado,
        st.comentario_estudiante AS comentarioEstudiante,
        st.comentario_tutor AS comentarioTutor,
        st.calificacion,
        st.costo_tutoria AS costoTutoria
      FROM sesiones_tutoria st
      JOIN usuarios ue ON ue.id = st.estudiante_id
      JOIN materias m ON m.id = st.materia_id
      WHERE st.id = ?
      LIMIT 1
      `,
      [sesionId]
    );

    return NextResponse.json(
      { message: "Sesión actualizada", sesion: rows?.[0] ?? null },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error PUT sesion:", error);
    return NextResponse.json(
      { message: "Error interno", detail: error?.message },
      { status: 500 }
    );
  }
}
