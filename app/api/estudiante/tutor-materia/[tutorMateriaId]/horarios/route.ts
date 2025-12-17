import { NextResponse } from "next/server";
import pool from "@/lib/db";
import type { RowDataPacket } from "mysql2";

interface TutorMateriaRow extends RowDataPacket {
  tutor_materia_id: number;
  materia_id: number;
  materia_nombre: string;
  tutor_id: number;
  tutor_nombre: string;
  tutor_apellido: string;
  tutor_carrera: string | null;
  tutor_imagen: string | null;
  semestres_raw: string | null;
}

interface DisponibilidadRow extends RowDataPacket {
  dia_semana:
    | "LUNES"
    | "MARTES"
    | "MIERCOLES"
    | "JUEVES"
    | "VIERNES"
    | "SABADO"
    | "DOMINGO";
  hora_inicio: string; // "08:00:00"
  hora_fin: string; // "10:00:00"
}

// GET /api/estudiante/tutor-materia/:tutorMateriaId/horarios
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ tutorMateriaId: string }> }
) {
  const { tutorMateriaId } = await params;
  const tmIdNum = Number(tutorMateriaId);

  if (!tutorMateriaId || Number.isNaN(tmIdNum)) {
    return NextResponse.json(
      { message: "tutorMateriaId inválido" },
      { status: 400 }
    );
  }

  try {
    const conn = await pool.getConnection();

    // 1️⃣ Detalle de tutor + materia + semestres
    const [detalleRows] = await conn.query<TutorMateriaRow[]>(
      `
      SELECT
        tm.id AS tutor_materia_id,
        m.id AS materia_id,
        m.nombre AS materia_nombre,
        u.id AS tutor_id,
        u.nombre AS tutor_nombre,
        u.apellido AS tutor_apellido,
        t.carrera AS tutor_carrera,
        u.imagen_perfil AS tutor_imagen,
        GROUP_CONCAT(DISTINCT ms.semestre ORDER BY ms.semestre SEPARATOR ',') AS semestres_raw
      FROM tutor_materia tm
      JOIN materias m       ON m.id = tm.materia_id
      JOIN usuarios u       ON u.id = tm.tutor_id
      LEFT JOIN tutores t   ON t.usuario_id = u.id
      LEFT JOIN materia_semestre ms ON ms.materia_id = m.id
      WHERE tm.id = ?
      GROUP BY
        tm.id,
        m.id, m.nombre,
        u.id, u.nombre, u.apellido,
        t.carrera, u.imagen_perfil
    `,
      [tmIdNum]
    );

    if (detalleRows.length === 0) {
      conn.release();
      return NextResponse.json(
        { message: "No se encontró tutor_materia" },
        { status: 404 }
      );
    }

    const d = detalleRows[0];

    const semestres =
      d.semestres_raw?.split(",").map((s) => s.trim()) ?? [];

    const detalle = {
      tutor_materia_id: d.tutor_materia_id,
      materia_id: d.materia_id,
      materia_nombre: d.materia_nombre,
      tutor_id: d.tutor_id,
      tutor_nombre: d.tutor_nombre,
      tutor_apellido: d.tutor_apellido,
      tutor_carrera: d.tutor_carrera ?? "",
      tutor_imagen: d.tutor_imagen,
      semestres,
      // por ahora, modo por defecto VIRTUAL
      modalidad_presencial: false,
      modalidad_virtual: true,
    };

    // 2️⃣ Disponibilidad base del tutor (por día de semana)
    const [dispRows] = await conn.query<DisponibilidadRow[]>(
      `
      SELECT dia_semana, hora_inicio, hora_fin
      FROM disponibilidad_tutor
      WHERE tutor_id = ?
      ORDER BY
        FIELD(dia_semana,'LUNES','MARTES','MIERCOLES','JUEVES','VIERNES','SABADO','DOMINGO'),
        hora_inicio
    `,
      [d.tutor_id]
    );

    conn.release();

    const disponibilidad = dispRows.map((row) => ({
      dia_semana: row.dia_semana,
      hora_inicio: row.hora_inicio, // "HH:MM:SS"
      hora_fin: row.hora_fin,
    }));

    return NextResponse.json({ detalle, disponibilidad });
  } catch (err) {
    console.error(
      "ERROR /api/estudiante/tutor-materia/[tutorMateriaId]/horarios:",
      err
    );
    return NextResponse.json(
      { message: "Error al obtener horarios del tutor" },
      { status: 500 }
    );
  }
}
