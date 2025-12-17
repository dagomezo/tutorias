import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

// GET /api/admin/dashboard
export async function GET(_req: NextRequest) {
  try {
    // Total estudiantes
    const [rowsEstudiantes] = await pool.query(
      "SELECT COUNT(*) AS total FROM estudiantes"
    );
    const totalEstudiantes = (rowsEstudiantes as any[])[0]?.total ?? 0;

    // Total tutores
    const [rowsTutores] = await pool.query(
      "SELECT COUNT(*) AS total FROM tutores"
    );
    const totalTutores = (rowsTutores as any[])[0]?.total ?? 0;

    // Sesiones de este mes (por fecha_hora_inicio)
    const [rowsSesiones] = await pool.query(
      `
      SELECT COUNT(*) AS total
      FROM sesiones_tutoria
      WHERE DATE_FORMAT(fecha_hora_inicio, '%Y-%m') = DATE_FORMAT(CURRENT_DATE(), '%Y-%m')
      `
    );
    const sesionesMes = (rowsSesiones as any[])[0]?.total ?? 0;

    return NextResponse.json({
      totalEstudiantes,
      totalTutores,
      sesionesMes,
    });
  } catch (error: any) {
    console.error("Error en dashboard admin:", error);
    return NextResponse.json(
      { message: "Error al obtener datos del dashboard", error: error?.message },
      { status: 500 }
    );
  }
}
