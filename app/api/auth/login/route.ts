import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import bcrypt from "bcryptjs";
import type { RowDataPacket } from "mysql2";

type UsuarioRow = RowDataPacket & {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  password_hash: string;
  rol: "ESTUDIANTE" | "TUTOR" | "ADMIN";
  imagen_perfil: string | null;
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = String(body?.email ?? "").trim();
    const password = String(body?.password ?? "").trim();

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email y contraseña son obligatorios" },
        { status: 400 }
      );
    }

    const [rows] = await pool.query<UsuarioRow[]>(
      `SELECT id, nombre, apellido, email, password_hash, rol, imagen_perfil
       FROM usuarios
       WHERE email = ?
       LIMIT 1`,
      [email]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { message: "Usuario o contraseña incorrectos" },
        { status: 401 }
      );
    }

    const usuario = rows[0];
    const ok = await bcrypt.compare(password, usuario.password_hash);

    if (!ok) {
      return NextResponse.json(
        { message: "Usuario o contraseña incorrectos" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        message: "Login correcto",
        user: {
          id: usuario.id,
          nombre: usuario.nombre,
          apellido: usuario.apellido,
          email: usuario.email,
          rol: usuario.rol,
          imagen_perfil: usuario.imagen_perfil,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error en login:", error);
    return NextResponse.json(
      { message: error?.message || "Error interno" },
      { status: 500 }
    );
  }
}
