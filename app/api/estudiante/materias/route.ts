// app/api/estudiante/materias/route.ts
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import type { RowDataPacket } from "mysql2";

// Cada fila del query
interface MateriaRow extends RowDataPacket {
  id: number;
  nombre: string;
  semestres_raw: string | null; // "1,2,3" etc
}

// Convierte "1", "2", "3" → "1er semestre", etc.
function formatSemestre(raw: string) {
  const num = Number(raw);
  if (num === 1) return "1er semestre";
  if (num === 2) return "2do semestre";
  if (num === 3) return "3er semestre";
  return `${raw}° semestre`;
}

export async function GET() {
  try {
    const conn = await pool.getConnection();

    const [rows] = await conn.query<MateriaRow[]>(
      `
      SELECT 
        m.id,
        m.nombre,
        GROUP_CONCAT(ms.semestre ORDER BY ms.semestre SEPARATOR ',') AS semestres_raw
      FROM materias m
      LEFT JOIN materia_semestre ms ON ms.materia_id = m.id
      GROUP BY m.id, m.nombre
      ORDER BY m.nombre ASC
    `
    );

    conn.release();

    const materias = rows.map((row) => {
      const semestresList = row.semestres_raw
        ? row.semestres_raw
            .split(",")
            .map((s) => formatSemestre(s.trim()))
        : [];

      return {
        id: row.id,
        nombre: row.nombre,
        semestres:
          semestresList.length > 0
            ? semestresList.join(", ")
            : "Semestre sin definir",
      };
    });

    return NextResponse.json({ materias });
  } catch (err) {
    console.error("ERROR /api/estudiante/materias:", err);
    return NextResponse.json(
      { message: "Error al obtener las materias" },
      { status: 500 }
    );
  }
}
