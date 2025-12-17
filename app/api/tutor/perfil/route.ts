import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

// GET: obtener perfil del tutor por tutorId
export async function GET(req: NextRequest) {
  try {
    const tutorIdStr = req.nextUrl.searchParams.get("tutorId");
    if (!tutorIdStr) {
      return NextResponse.json(
        { message: "tutorId es obligatorio" },
        { status: 400 }
      );
    }

    const tutorId = Number(tutorIdStr);
    if (Number.isNaN(tutorId)) {
      return NextResponse.json(
        { message: "tutorId inválido" },
        { status: 400 }
      );
    }

    const [rows] = await pool.query(
      `
      SELECT 
        u.id AS tutorId,
        u.nombre,
        u.apellido,
        u.email,
        t.telefono,
        t.carrera,
        t.descripcion,
        t.link_zoom AS linkZoom
      FROM usuarios u
      LEFT JOIN tutores t ON t.usuario_id = u.id
      WHERE u.id = ?
        AND u.rol = 'TUTOR'
      LIMIT 1
      `,
      [tutorId]
    );

    const perfil = (rows as any[])[0];

    if (!perfil) {
      return NextResponse.json(
        { message: "No se encontró el usuario tutor con ese ID." },
        { status: 404 }
      );
    }

    return NextResponse.json({ perfil });
  } catch (error: any) {
    console.error("Error obteniendo perfil de tutor:", error);
    return NextResponse.json(
      { message: "Error al obtener el perfil", error: error?.message },
      { status: 500 }
    );
  }
}

// PUT: crear/actualizar perfil del tutor (UPSERT)
export async function PUT(req: NextRequest) {
  try {
    const { tutorId, telefono, carrera, descripcion, linkZoom } =
      await req.json();

    if (!tutorId) {
      return NextResponse.json(
        { message: "tutorId es obligatorio" },
        { status: 400 }
      );
    }

    await pool.query(
      `
      INSERT INTO tutores (usuario_id, telefono, carrera, descripcion, link_zoom)
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        telefono   = VALUES(telefono),
        carrera    = VALUES(carrera),
        descripcion = VALUES(descripcion),
        link_zoom  = VALUES(link_zoom)
      `,
      [tutorId, telefono || null, carrera || null, descripcion || null, linkZoom || null]
    );

    // devolvemos el perfil ya actualizado
    const [rows] = await pool.query(
      `
      SELECT 
        u.id AS tutorId,
        u.nombre,
        u.apellido,
        u.email,
        t.telefono,
        t.carrera,
        t.descripcion,
        t.link_zoom AS linkZoom
      FROM usuarios u
      LEFT JOIN tutores t ON t.usuario_id = u.id
      WHERE u.id = ?
        AND u.rol = 'TUTOR'
      LIMIT 1
      `,
      [tutorId]
    );

    const perfilActualizado = (rows as any[])[0];

    return NextResponse.json({
      message: "Perfil actualizado correctamente",
      perfil: perfilActualizado,
    });
  } catch (error: any) {
    console.error("Error actualizando perfil de tutor:", error);
    return NextResponse.json(
      { message: "Error al actualizar el perfil", error: error?.message },
      { status: 500 }
    );
  }
}
