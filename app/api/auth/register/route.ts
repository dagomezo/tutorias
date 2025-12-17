import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import bcrypt from "bcryptjs";

// ✅ Validador de cédula ecuatoriana (10 dígitos)
function validarCedulaEcuador(cedula: string): boolean {
  const c = cedula.trim();
  if (!/^\d{10}$/.test(c)) return false;

  const provincia = parseInt(c.slice(0, 2), 10);
  if (!((provincia >= 1 && provincia <= 24) || provincia === 30)) return false;

  const tercer = parseInt(c[2], 10);
  if (tercer >= 6) return false;

  const coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2];
  let suma = 0;

  for (let i = 0; i < 9; i++) {
    let valor = parseInt(c[i], 10) * coeficientes[i];
    if (valor >= 10) valor -= 9;
    suma += valor;
  }

  const modulo = suma % 10;
  const digitoVerificador = modulo === 0 ? 0 : 10 - modulo;

  return digitoVerificador === parseInt(c[9], 10);
}

// 🔹 SOLO REGISTRA ESTUDIANTES
export async function POST(req: NextRequest) {
  try {
    const {
      nombre,
      apellido,
      email,
      password,
      cedula,
      telefono,
      carrera,
      ciclo,
    } = await req.json();

    if (!nombre || !apellido || !email || !password || !cedula) {
      return NextResponse.json(
        { message: "Faltan campos obligatorios" },
        { status: 400 }
      );
    }

    if (!validarCedulaEcuador(cedula)) {
      return NextResponse.json(
        { message: "La cédula ingresada no es válida" },
        { status: 400 }
      );
    }

    // ¿Existe ya el email?
    const [rows] = await pool.query(
      "SELECT id FROM usuarios WHERE email = ? LIMIT 1",
      [email]
    );
    if (Array.isArray(rows) && rows.length > 0) {
      return NextResponse.json(
        { message: "Ya existe un usuario con este correo" },
        { status: 409 }
      );
    }

    const password_hash = await bcrypt.hash(password, 10);

    // Crear usuario base
    const [insertUsuario]: any = await pool.query(
      `
      INSERT INTO usuarios (nombre, apellido, email, password_hash, rol)
      VALUES (?, ?, ?, ?, 'ESTUDIANTE')
      `,
      [nombre, apellido, email, password_hash]
    );

    const usuarioId = insertUsuario.insertId;

    // Crear registro de estudiante
    await pool.query(
      `
      INSERT INTO estudiantes (usuario_id, cedula, telefono, carrera, ciclo)
      VALUES (?, ?, ?, ?, ?)
      `,
      [usuarioId, cedula, telefono || null, carrera || null, ciclo || null]
    );

    const user = {
      id: usuarioId,
      nombre,
      apellido,
      email,
      rol: "ESTUDIANTE",
      imagen_perfil: null,
    };

    return NextResponse.json(
      { message: "Registro exitoso", user },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error en /api/auth/register:", error);
    return NextResponse.json(
      {
        message: "Error interno del servidor",
        detail: error?.message ?? null,
      },
      { status: 500 }
    );
  }
}
