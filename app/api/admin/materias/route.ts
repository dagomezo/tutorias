import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET() {
  try {
    const [rows] = await pool.query(
      `
      SELECT
        m.id,
        m.nombre,
        m.descripcion,
        GROUP_CONCAT(ms.semestre ORDER BY ms.semestre SEPARATOR ', ') AS semestres,
        (
          SELECT tm.tutor_id
          FROM tutor_materia tm
          WHERE tm.materia_id = m.id
          LIMIT 1
        ) AS tutorId,
        (
          SELECT CONCAT(u.nombre, ' ', u.apellido)
          FROM tutor_materia tm2
          JOIN tutores t ON t.usuario_id = tm2.tutor_id
          JOIN usuarios u ON u.id = t.usuario_id
          WHERE tm2.materia_id = m.id
          ORDER BY u.apellido, u.nombre
          LIMIT 1
        ) AS tutorNombre
      FROM materias m
      LEFT JOIN materia_semestre ms ON ms.materia_id = m.id
      GROUP BY m.id, m.nombre, m.descripcion
      ORDER BY m.nombre
      `
    );

    return NextResponse.json({ materias: rows });
  } catch (err: any) {
    console.error("Error GET materias:", err);
    return NextResponse.json(
      { message: "Error al obtener materias" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      nombre,
      descripcion = null,
      semestres = [],
      tutorId = null,
    } = body as {
      nombre: string;
      descripcion?: string | null;
      semestres?: string[];
      tutorId?: number | null;
    };

    if (!nombre) {
      return NextResponse.json(
        { message: "El nombre de la materia es obligatorio." },
        { status: 400 }
      );
    }

    // Crear materia
    const [result]: any = await pool.query(
      `
      INSERT INTO materias (nombre, descripcion)
      VALUES (?, ?)
      `,
      [nombre.trim(), descripcion || null]
    );
    const materiaId = result.insertId as number;

    // Semestres
    if (Array.isArray(semestres)) {
      for (const s of semestres) {
        const sem = s.trim();
        if (!sem) continue;
        await pool.query(
          `
          INSERT INTO materia_semestre (materia_id, semestre)
          VALUES (?, ?)
          `,
          [materiaId, sem]
        );
      }
    }

    // Relación con tutor (tutor_materia), costo 0 porque son gratis
    if (tutorId) {
      await pool.query(
        `
        INSERT INTO tutor_materia (tutor_id, materia_id, costo_tutoria)
        VALUES (?, ?, 0.00)
        `,
        [tutorId, materiaId]
      );
    }

    // Devolver la fila ya armada
    const [rows] = await pool.query(
      `
      SELECT
        m.id,
        m.nombre,
        m.descripcion,
        GROUP_CONCAT(ms.semestre ORDER BY ms.semestre SEPARATOR ', ') AS semestres,
        (
          SELECT tm.tutor_id
          FROM tutor_materia tm
          WHERE tm.materia_id = m.id
          LIMIT 1
        ) AS tutorId,
        (
          SELECT CONCAT(u.nombre, ' ', u.apellido)
          FROM tutor_materia tm2
          JOIN tutores t ON t.usuario_id = tm2.tutor_id
          JOIN usuarios u ON u.id = t.usuario_id
          WHERE tm2.materia_id = m.id
          ORDER BY u.apellido, u.nombre
          LIMIT 1
        ) AS tutorNombre
      FROM materias m
      LEFT JOIN materia_semestre ms ON ms.materia_id = m.id
      WHERE m.id = ?
      GROUP BY m.id, m.nombre, m.descripcion
      `,
      [materiaId]
    );

    const materia = Array.isArray(rows) ? rows[0] : rows;

    return NextResponse.json({ materia }, { status: 201 });
  } catch (err: any) {
    console.error("Error POST materia:", err);
    return NextResponse.json(
      { message: "Error al crear materia" },
      { status: 500 }
    );
  }
}
