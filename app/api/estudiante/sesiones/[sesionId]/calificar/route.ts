import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { sesionId: string } }
) {
  try {
    const sesionId = Number(params.sesionId);
    const body = await req.json().catch(() => ({}));

    const estudianteId = Number(body?.estudianteId);
    const calificacion = Number(body?.calificacion);
    const comentario = (body?.comentario ?? "").toString();

    if (!sesionId || Number.isNaN(sesionId)) {
      return NextResponse.json({ message: "sesionId inválido" }, { status: 400 });
    }
    if (!estudianteId || Number.isNaN(estudianteId)) {
      return NextResponse.json(
        { message: "estudianteId es obligatorio" },
        { status: 400 }
      );
    }
    if (!calificacion || Number.isNaN(calificacion) || calificacion < 1 || calificacion > 10) {
      return NextResponse.json(
        { message: "La calificación debe estar entre 1 y 10" },
        { status: 400 }
      );
    }

    // ✅ Solo si está COMPLETADA y no tiene calificación aún
    const [result]: any = await pool.query(
      `
      UPDATE sesiones_tutoria
      SET calificacion = ?, comentario_estudiante = ?
      WHERE id = ?
        AND estudiante_id = ?
        AND estado = 'COMPLETADA'
        AND (calificacion IS NULL)
      `,
      [calificacion, comentario || null, sesionId, estudianteId]
    );

    if (!result?.affectedRows) {
      return NextResponse.json(
        { message: "No se pudo calificar (ya calificada o no está completada)." },
        { status: 400 }
      );
    }

    return NextResponse.json({ message: "Calificación guardada" }, { status: 200 });
  } catch (error: any) {
    console.error("Error PATCH /calificar:", error);
    return NextResponse.json(
      { message: "Error interno", detail: error?.message ?? null },
      { status: 500 }
    );
  }
}
