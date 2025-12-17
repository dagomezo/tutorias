import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import type { RowDataPacket } from "mysql2";

type PerfilRow = RowDataPacket & {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  cedula: string;
  telefono: string | null;
  carrera: string | null;
  ciclo: string | null;
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const estudianteId = searchParams.get("estudianteId");

    if (!estudianteId) {
      return NextResponse.json(
        { message: "estudianteId es obligatorio" },
        { status: 400 }
      );
    }

    const [rows] = await pool.query<PerfilRow[]>(
      `
      SELECT 
        u.id,
        u.nombre,
        u.apellido,
        u.email,
        e.cedula,
        e.telefono,
        e.carrera,
        e.ciclo
      FROM usuarios u
      INNER JOIN estudiantes e ON e.usuario_id = u.id
      WHERE u.id = ?
      LIMIT 1
      `,
      [estudianteId]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { message: "Estudiante no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { estudiante: rows[0] },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error perfil estudiante:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
