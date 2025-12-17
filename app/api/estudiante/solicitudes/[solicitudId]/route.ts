import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import type { RowDataPacket } from "mysql2";

type SolRow = RowDataPacket & {
  id: number;
  tutor_id: number;
  estudiante_id: number;
  sesion_id: number | null;
  estado: "PENDIENTE" | "ACEPTADA" | "RECHAZADA" | "CANCELADA";
};

export async function PUT(req: NextRequest, ctx: { params: { solicitudId: string } }) {
  const solicitudId = Number(ctx.params.solicitudId);

  try {
    const body = await req.json().catch(() => ({}));
    const nuevoEstado = String(body?.nuevoEstado ?? "").toUpperCase();

    if (!solicitudId || !["ACEPTADA", "RECHAZADA"].includes(nuevoEstado)) {
      return NextResponse.json({ message: "Parámetros inválidos" }, { status: 400 });
    }

    // 1) leer solicitud para obtener sesion_id
    const [rows] = await pool.query<SolRow[]>(
      `SELECT id, tutor_id, estudiante_id, sesion_id, estado
       FROM solicitudes_tutoria
       WHERE id = ?
       LIMIT 1`,
      [solicitudId]
    );

    if (rows.length === 0) {
      return NextResponse.json({ message: "Solicitud no encontrada" }, { status: 404 });
    }

    const sol = rows[0];

    // 2) actualizar solicitud
    await pool.query(
      `UPDATE solicitudes_tutoria SET estado = ? WHERE id = ?`,
      [nuevoEstado, solicitudId]
    );

    // 3) actualizar sesión asociada (CLAVE)
    if (sol.sesion_id) {
      const estadoSesion = nuevoEstado === "ACEPTADA" ? "ACEPTADA" : "RECHAZADA";

      await pool.query(
        `UPDATE sesiones_tutoria
         SET estado = ?
         WHERE id = ?`,
        [estadoSesion, sol.sesion_id]
      );
    }

    // devolver solicitud actualizada (mínimo)
    return NextResponse.json(
      {
        message: "Solicitud actualizada",
        solicitud: {
          id: sol.id,
          estudianteId: sol.estudiante_id,
          nuevoEstado,
          sesionId: sol.sesion_id,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error actualizando solicitud:", error);
    return NextResponse.json({ message: "Error interno", detail: error?.message }, { status: 500 });
  }
}
