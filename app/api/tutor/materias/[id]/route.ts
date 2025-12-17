import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

type Params = { id: string };

// PUT /api/tutor/materias/:id  (editar)
export async function PUT(req: NextRequest, { params }: { params: Params }) {
  try {
    const id = Number(params.id);
    if (Number.isNaN(id)) {
      return NextResponse.json({ message: "ID inválido" }, { status: 400 });
    }

    const { nombre, descripcion, costoTutoria } = await req.json();

    // Buscar materia_id
    const [rowsMateria] = await pool.query(
      `SELECT materia_id FROM tutor_materia WHERE id = ?`,
      [id]
    );

    const row = (rowsMateria as any[])[0];
    if (!row) {
      return NextResponse.json(
        { message: "No se encontró la relación tutor-materia" },
        { status: 404 }
      );
    }

    const materiaId = row.materia_id as number;

    // Actualizar materia
    await pool.query(
      `
      UPDATE materias
      SET nombre = ?, descripcion = ?
      WHERE id = ?
      `,
      [nombre, descripcion || null, materiaId]
    );

    // Actualizar costo en tutor_materia
    await pool.query(
      `
      UPDATE tutor_materia
      SET costo_tutoria = ?
      WHERE id = ?
      `,
      [costoTutoria ?? null, id]
    );

    // Devolver fila actualizada
    const [rows] = await pool.query(
      `
      SELECT 
        tm.id,
        tm.materia_id AS materiaId,
        m.nombre,
        m.descripcion,
        tm.costo_tutoria AS costoTutoria
      FROM tutor_materia tm
      JOIN materias m ON m.id = tm.materia_id
      WHERE tm.id = ?
      LIMIT 1
      `,
      [id]
    );

    const materia = (rows as any[])[0];

    return NextResponse.json({ materia });
  } catch (error: any) {
    console.error("Error actualizando materia de tutor:", error);
    return NextResponse.json(
      { message: "Error al actualizar la materia", error: error?.message },
      { status: 500 }
    );
  }
}

// DELETE /api/tutor/materias/:id  (eliminar)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Params }
) {
  try {
    const id = Number(params.id);
    if (Number.isNaN(id)) {
      return NextResponse.json({ message: "ID inválido" }, { status: 400 });
    }

    // obtener materia_id
    const [rowsMateria] = await pool.query(
      `SELECT materia_id FROM tutor_materia WHERE id = ?`,
      [id]
    );

    const row = (rowsMateria as any[])[0];
    if (!row) {
      return NextResponse.json(
        { message: "No se encontró la relación tutor-materia" },
        { status: 404 }
      );
    }

    const materiaId = row.materia_id as number;

    // eliminar relación
    await pool.query(`DELETE FROM tutor_materia WHERE id = ?`, [id]);

    // borrar la materia si ya no la usa nadie más
    const [rowsCount] = await pool.query(
      `SELECT COUNT(*) AS c FROM tutor_materia WHERE materia_id = ?`,
      [materiaId]
    );
    const c = (rowsCount as any[])[0]?.c as number;
    if (c === 0) {
      await pool.query(`DELETE FROM materias WHERE id = ?`, [materiaId]);
    }

    return NextResponse.json(
      { message: "Materia eliminada correctamente" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error eliminando materia de tutor:", error);
    return NextResponse.json(
      { message: "Error al eliminar la materia", error: error?.message },
      { status: 500 }
    );
  }
}
