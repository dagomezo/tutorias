import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

// Usaremos el mismo hash de contraseña que ya utilizaste antes para el tutor Michael
const DEFAULT_PASSWORD_HASH =
  "$2b$10$.omcBGkFeIqRdI2Sk8sIFuXOzzhX0pKF9Mxv1JehsDzMwu/oU2Soi";

// GET /api/admin/estudiantes
export async function GET(_req: NextRequest) {
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
        e.cedula,
        e.telefono,
        e.carrera,
        e.ciclo
      FROM usuarios u
      LEFT JOIN estudiantes e ON e.usuario_id = u.id
      WHERE u.rol = 'ESTUDIANTE'
      ORDER BY u.apellido, u.nombre
      `
    );

    return NextResponse.json({ estudiantes: rows });
  } catch (error: any) {
    console.error("Error listando estudiantes:", error);
    return NextResponse.json(
      { message: "Error al obtener estudiantes", error: error?.message },
      { status: 500 }
    );
  }
}

// POST /api/admin/estudiantes  (crear estudiante+usuario)
export async function POST(req: NextRequest) {
  try {
    const {
      nombre,
      apellido,
      email,
      cedula,
      telefono,
      carrera,
      ciclo,
    } = await req.json();

    if (!nombre || !apellido || !email || !cedula) {
      return NextResponse.json(
        {
          message:
            "Nombre, apellido, email y cédula son obligatorios para crear un estudiante.",
        },
        { status: 400 }
      );
    }

    // Crear usuario con rol ESTUDIANTE
    const [userResult] = await pool.query(
      `
      INSERT INTO usuarios (nombre, apellido, email, password_hash, rol, imagen_perfil)
      VALUES (?, ?, ?, ?, 'ESTUDIANTE', NULL)
      `,
      [nombre, apellido, email, DEFAULT_PASSWORD_HASH]
    );

    const usuarioId = (userResult as any).insertId as number;

    // Crear registro en estudiantes
    await pool.query(
      `
      INSERT INTO estudiantes (usuario_id, cedula, telefono, carrera, ciclo)
      VALUES (?, ?, ?, ?, ?)
      `,
      [usuarioId, cedula, telefono || null, carrera || null, ciclo || null]
    );

    // Devolver fila unificada
    const [rows] = await pool.query(
      `
      SELECT 
        u.id,
        u.nombre,
        u.apellido,
        u.email,
        u.rol,
        u.imagen_perfil,
        e.cedula,
        e.telefono,
        e.carrera,
        e.ciclo
      FROM usuarios u
      LEFT JOIN estudiantes e ON e.usuario_id = u.id
      WHERE u.id = ?
      LIMIT 1
      `,
      [usuarioId]
    );

    const estudiante = (rows as any[])[0];

    return NextResponse.json({ estudiante }, { status: 201 });
  } catch (error: any) {
    console.error("Error creando estudiante:", error);
    return NextResponse.json(
      { message: "Error al crear estudiante", error: error?.message },
      { status: 500 }
    );
  }
}
