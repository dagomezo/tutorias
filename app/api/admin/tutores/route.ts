import { NextResponse } from "next/server";
import pool from "@/lib/db";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
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
      WHERE u.rol = 'TUTOR'
      ORDER BY u.apellido, u.nombre
      `
    );
    return NextResponse.json({ tutores: rows });
  } catch (err: any) {
    console.error("Error GET tutores:", err);
    return NextResponse.json(
      { message: "Error al obtener tutores" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
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

    // Verificar email duplicado
    const [existing] = await pool.query(
      "SELECT id FROM usuarios WHERE email = ?",
      [email]
    );
    if (Array.isArray(existing) && existing.length > 0) {
      return NextResponse.json(
        { message: "Ya existe un usuario con ese email." },
        { status: 400 }
      );
    }

    // Password por defecto (123456)
    const hash = await bcrypt.hash("123456", 10);

    const [resultUser]: any = await pool.query(
      `
      INSERT INTO usuarios (nombre, apellido, email, password_hash, rol, imagen_perfil)
      VALUES (?, ?, ?, ?, 'TUTOR', NULL)
      `,
      [nombre.trim(), apellido.trim(), email.trim(), hash]
    );

    const usuarioId = resultUser.insertId as number;

    await pool.query(
      `
      INSERT INTO tutores (usuario_id, telefono, carrera, descripcion, link_zoom)
      VALUES (?, ?, ?, ?, ?)
      `,
      [usuarioId, telefono, carrera, descripcion, link_zoom]
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
      [usuarioId]
    );

    const tutor = Array.isArray(rows) ? rows[0] : rows;

    return NextResponse.json({ tutor }, { status: 201 });
  } catch (err: any) {
    console.error("Error POST tutor:", err);
    return NextResponse.json(
      { message: "Error al crear tutor." },
      { status: 500 }
    );
  }
}
