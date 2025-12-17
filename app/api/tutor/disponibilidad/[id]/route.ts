import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/tutor/solicitudes/:tutorId
 * Lista las solicitudes de tutoría para ese tutor
 */
export async function GET(_req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
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
        s.id,
        s.estudiante_id   AS estudianteId,
        s.materia_id      AS materiaId,
        s.nombre_estudiante AS nombreEstudiante,
        s.cedula_estudiante AS cedulaEstudiante,
        s.comentario,
        s.estado,
        s.fecha_solicitud AS fechaSolicitud,
        m.nombre          AS materiaNombre
      FROM solicitudes_tutoria s
      JOIN materias m ON m.id = s.materia_id
      WHERE s.tutor_id = ?
      ORDER BY s.fecha_solicitud DESC
      `,
      [tutorId]
    );

    return NextResponse.json({ solicitudes: rows });
  } catch (err) {
    console.error("Error GET solicitudes tutor:", err);
    return NextResponse.json(
      { message: "Error al obtener las solicitudes." },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/tutor/solicitudes/:solicitudId
 * Cambia el estado y crea una notificación al estudiante
 * body: { nuevoEstado: 'ACEPTADA' | 'RECHAZADA', estudianteId: number }
 */
export async function PUT(req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const solicitudId = Number(id);

    if (Number.isNaN(solicitudId)) {
      return NextResponse.json(
        { message: "ID de solicitud inválido." },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { nuevoEstado, estudianteId } = body as {
      nuevoEstado: "ACEPTADA" | "RECHAZADA";
      estudianteId: number;
    };

    if (!["ACEPTADA", "RECHAZADA"].includes(nuevoEstado)) {
      return NextResponse.json(
        { message: "Estado no permitido." },
        { status: 400 }
      );
    }

    // 1) Actualizar estado de la solicitud
    await pool.query(
      "UPDATE solicitudes_tutoria SET estado = ? WHERE id = ?",
      [nuevoEstado, solicitudId]
    );

    // 2) Crear notificación para el estudiante
    const mensaje =
      nuevoEstado === "ACEPTADA"
        ? "Tu solicitud de tutoría ha sido ACEPTADA."
        : "Tu solicitud de tutoría ha sido RECHAZADA.";

    await pool.query(
      `
      INSERT INTO notificaciones (estudiante_id, mensaje, tipo)
      VALUES (?, ?, 'SOLICITUD')
      `,
      [estudianteId, mensaje]
    );

    // 3) Devolver la solicitud actualizada
    const [rows] = await pool.query(
      `
      SELECT 
        s.id,
        s.estudiante_id   AS estudianteId,
        s.materia_id      AS materiaId,
        s.nombre_estudiante AS nombreEstudiante,
        s.cedula_estudiante AS cedulaEstudiante,
        s.comentario,
        s.estado,
        s.fecha_solicitud AS fechaSolicitud,
        m.nombre          AS materiaNombre
      FROM solicitudes_tutoria s
      JOIN materias m ON m.id = s.materia_id
      WHERE s.id = ?
      `,
      [solicitudId]
    );

    const solicitudActualizada = (rows as any[])[0] ?? null;

    return NextResponse.json({ solicitud: solicitudActualizada });
  } catch (err) {
    console.error("Error PUT solicitudes tutor:", err);
    return NextResponse.json(
      { message: "Error al actualizar la solicitud." },
      { status: 500 }
    );
  }
}
