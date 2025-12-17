import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

// 👇 Nota: params ahora es Promise<{ id: string }>
type RouteContext = {
  params: Promise<{ id: string }>;
};

// PUT /api/admin/estudiantes/:id  (editar usuario + estudiante)
export async function PUT(req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params; // 👈 aquí se hace await
    const usuarioId = Number(id);

    if (Number.isNaN(usuarioId)) {
      return NextResponse.json({ message: "ID inválido" }, { status: 400 });
    }

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
            "Nombre, apellido, email y cédula son obligatorios para actualizar.",
        },
        { status: 400 }
      );
    }

    // Actualizar tabla usuarios
    await pool.query(
      `
      UPDATE usuarios
      SET nombre = ?, apellido = ?, email = ?
      WHERE id = ? AND rol = 'ESTUDIANTE'
      `,
      [nombre, apellido, email, usuarioId]
    );

    // Aseguramos/actualizamos fila en estudiantes
    await pool.query(
      `
      INSERT INTO estudiantes (usuario_id, cedula, telefono, carrera, ciclo)
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        cedula = VALUES(cedula),
        telefono = VALUES(telefono),
        carrera = VALUES(carrera),
        ciclo = VALUES(ciclo)
      `,
      [usuarioId, cedula, telefono || null, carrera || null, ciclo || null]
    );

    // Devolver el registro actualizado
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

    return NextResponse.json({ estudiante });
  } catch (error: any) {
    console.error("Error actualizando estudiante:", error);
    return NextResponse.json(
      { message: "Error al actualizar estudiante", error: error?.message },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/estudiantes/:id
export async function DELETE(_req: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params; // 👈 también aquí
    const usuarioId = Number(id);

    if (Number.isNaN(usuarioId)) {
      return NextResponse.json({ message: "ID inválido" }, { status: 400 });
    }

    await pool.query(
      `DELETE FROM usuarios WHERE id = ? AND rol = 'ESTUDIANTE'`,
      [usuarioId]
    );

    return NextResponse.json(
      { message: "Estudiante eliminado correctamente" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error eliminando estudiante:", error);
    return NextResponse.json(
      { message: "Error al eliminar estudiante", error: error?.message },
      { status: 500 }
    );
  }
}
