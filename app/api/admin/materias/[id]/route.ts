import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PUT(req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const materiaId = Number(id);
    if (Number.isNaN(materiaId)) {
      return NextResponse.json(
        { message: "ID de materia inválido." },
        { status: 400 }
      );
    }

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

    // Actualizar materia
    await pool.query(
      `
      UPDATE materias
      SET nombre = ?, descripcion = ?
      WHERE id = ?
      `,
      [nombre.trim(), descripcion || null, materiaId]
    );

    // Actualizar semestres: borramos todos y recreamos
    await pool.query(
      `DELETE FROM materia_semestre WHERE materia_id = ?`,
      [materiaId]
    );

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

    // Actualizar relación tutor_materia: dejamos solo el tutor elegido
    await pool.query(
      `DELETE FROM tutor_materia WHERE materia_id = ?`,
      [materiaId]
    );

    if (tutorId) {
      await pool.query(
        `
        INSERT INTO tutor_materia (tutor_id, materia_id, costo_tutoria)
        VALUES (?, ?, 0.00)
        `,
        [tutorId, materiaId]
      );
    }

    // Devolver fila actualizada
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

    return NextResponse.json({ materia });
  } catch (err: any) {
    console.error("Error PUT materia:", err);
    return NextResponse.json(
      { message: "Error al actualizar materia" },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const materiaId = Number(id);
    if (Number.isNaN(materiaId)) {
      return NextResponse.json(
        { message: "ID de materia inválido." },
        { status: 400 }
      );
    }

    // OJO: puede fallar si hay solicitudes_tutoria / sesiones_tutoria asociadas (ON DELETE RESTRICT)
    await pool.query(`DELETE FROM materias WHERE id = ?`, [materiaId]);

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("Error DELETE materia:", err);
    return NextResponse.json(
      {
        message:
          "No se pudo eliminar la materia. Verifica si tiene tutorías o solicitudes asociadas.",
      },
      { status: 500 }
    );
  }
}
