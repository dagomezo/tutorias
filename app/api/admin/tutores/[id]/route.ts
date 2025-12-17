import { NextResponse } from "next/server";
import pool from "@/lib/db";

type Params = { params: { id: string } };

export async function PUT(request: Request, { params }: Params) {
  try {
    const id = Number(params.id);
    const body = await request.json();
    const {
      nombre,
      apellido,
      email,
      telefono = null,
      carrera = null,
      descripcion = null,
      link_zoom = null,
    } = body;

    if (!nombre || !apellido || !email) {
      return NextResponse.json(
        { message: "Nombre, apellido y email son obligatorios." },
        { status: 400 }
      );
    }

    await pool.query(
      `
      UPDATE usuarios
      SET nombre = ?, apellido = ?, email = ?
      WHERE id = ?
      `,
      [nombre.trim(), apellido.trim(), email.trim(), id]
    );

    await pool.query(
      `
      INSERT INTO tutores (usuario_id, telefono, carrera, descripcion, link_zoom)
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        telefono = VALUES(telefono),
        carrera = VALUES(carrera),
        descripcion = VALUES(descripcion),
        link_zoom = VALUES(link_zoom)
      `,
      [id, telefono, carrera, descripcion, link_zoom]
    );

    const [rows] = await pool.query(
      `
      SELECT 
        u.id,
        u.nombre,
        u.apellido,
        u.email,
        u.rol,
        u.imagen_perfil,
        t.telefono,
        t.carrera,
        t.descripcion,
        t.link_zoom
      FROM usuarios u
      LEFT JOIN tutores t ON t.usuario_id = u.id
      WHERE u.id = ?
      `,
      [id]
    );

    const tutor = Array.isArray(rows) ? rows[0] : rows;

    return NextResponse.json({ tutor });
  } catch (err: any) {
    console.error("Error PUT tutor:", err);
    return NextResponse.json(
      { message: "Error al actualizar tutor." },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const id = Number(params.id);

    await pool.query("DELETE FROM usuarios WHERE id = ?", [id]);
    // Por FK ON DELETE CASCADE se borran tutores, disponibilidad, tutor_materia, etc.

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("Error DELETE tutor:", err);
    return NextResponse.json(
      { message: "Error al eliminar tutor." },
      { status: 500 }
    );
  }
}
