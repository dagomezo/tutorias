import pool from "@/lib/db";

type ProximaSesion = {
  id: number;
  materia: string;
  estudianteNombre: string;
  fechaInicio: string;
  fechaFin: string;
  estado: string;
  modalidad: string;
};

type SolicitudPendiente = {
  id: number;
  estudianteNombre: string;
  materia: string;
  comentario: string | null;
  fechaSolicitud: string;
};

type Metricas = {
  sesionesSemana: number;
  promedioCalificacion: number | null;
};

async function getDatosDashboard(tutorId: number) {
  // Próximas sesiones
  const [sesionesRows] = await pool.query(
    `
    SELECT 
      s.id,
      m.nombre AS materia,
      CONCAT(u.nombre, ' ', u.apellido) AS estudianteNombre,
      s.fecha_hora_inicio AS fechaInicio,
      s.fecha_hora_fin AS fechaFin,
      s.estado,
      s.modalidad
    FROM sesiones_tutoria s
    JOIN materias m ON m.id = s.materia_id
    JOIN estudiantes e ON e.usuario_id = s.estudiante_id
    JOIN usuarios u ON u.id = e.usuario_id
    WHERE s.tutor_id = ?
      AND s.fecha_hora_inicio >= NOW()
    ORDER BY s.fecha_hora_inicio
    LIMIT 5
    `,
    [tutorId]
  );

  // Solicitudes pendientes
  const [solicitudesRows] = await pool.query(
    `
    SELECT 
      sol.id,
      CONCAT(ue.nombre, ' ', ue.apellido) AS estudianteNombre,
      m.nombre AS materia,
      sol.comentario,
      sol.fecha_solicitud AS fechaSolicitud
    FROM solicitudes_tutoria sol
    JOIN estudiantes e ON e.usuario_id = sol.estudiante_id
    JOIN usuarios ue ON ue.id = e.usuario_id
    JOIN materias m ON m.id = sol.materia_id
    WHERE sol.tutor_id = ?
      AND sol.estado = 'PENDIENTE'
    ORDER BY sol.fecha_solicitud DESC
    LIMIT 5
    `,
    [tutorId]
  );

  // Métricas
  const [metricasRows] = await pool.query(
    `
    SELECT
      (SELECT COUNT(*) 
       FROM sesiones_tutoria 
       WHERE tutor_id = ?
         AND YEARWEEK(fecha_hora_inicio, 1) = YEARWEEK(CURDATE(), 1)
      ) AS sesionesSemana,
      (SELECT AVG(calificacion) 
       FROM sesiones_tutoria 
       WHERE tutor_id = ?
         AND calificacion IS NOT NULL
      ) AS promedioCalificacion
    `,
    [tutorId, tutorId]
  );

  return {
    proximasSesiones: sesionesRows as ProximaSesion[],
    solicitudesPendientes: solicitudesRows as SolicitudPendiente[],
    metricas: (metricasRows as any[])[0] as Metricas,
  };
}

export default async function TutorDashboardPage() {
  const tutorId = 1; // TODO: ID del tutor logueado
  const { proximasSesiones, solicitudesPendientes, metricas } =
    await getDatosDashboard(tutorId);

  return (
    <div className="space-y-8">
      {/* Métricas */}
      <section className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        <div className="rounded-2xl bg-white shadow-sm border border-slate-200 p-4">
          <p className="text-xs text-slate-500">Sesiones esta semana</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {metricas.sesionesSemana}
          </p>
        </div>
        <div className="rounded-2xl bg-white shadow-sm border border-slate-200 p-4">
          <p className="text-xs text-slate-500">Promedio de calificación</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {metricas.promedioCalificacion
              ? metricas.promedioCalificacion.toFixed(1)
              : "—"}
          </p>
        </div>
        <div className="rounded-2xl bg-white shadow-sm border border-slate-200 p-4">
          <p className="text-xs text-slate-500">Solicitudes pendientes</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {solicitudesPendientes.length}
          </p>
        </div>
      </section>

      {/* Próximas sesiones */}
      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl bg-white shadow-sm border border-slate-200 p-4">
          <h2 className="text-sm font-semibold text-slate-900 mb-3">
            Próximas sesiones
          </h2>
          {proximasSesiones.length === 0 ? (
            <p className="text-xs text-slate-500">
              No tienes sesiones próximas agendadas.
            </p>
          ) : (
            <ul className="space-y-3 text-xs">
              {proximasSesiones.map((s) => (
                <li
                  key={s.id}
                  className="rounded-lg border border-slate-200 px-3 py-2"
                >
                  <p className="font-medium text-slate-900">
                    {s.materia} · {s.modalidad}
                  </p>
                  <p className="text-slate-600">
                    {s.estudianteNombre}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {new Date(s.fechaInicio).toLocaleString()}{" "}
                    – {new Date(s.fechaFin).toLocaleTimeString()}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Solicitudes pendientes */}
        <div className="rounded-2xl bg-white shadow-sm border border-slate-200 p-4">
          <h2 className="text-sm font-semibold text-slate-900 mb-3">
            Solicitudes pendientes
          </h2>
          {solicitudesPendientes.length === 0 ? (
            <p className="text-xs text-slate-500">
              No tienes solicitudes pendientes.
            </p>
          ) : (
            <ul className="space-y-3 text-xs">
              {solicitudesPendientes.map((sol) => (
                <li
                  key={sol.id}
                  className="rounded-lg border border-slate-200 px-3 py-2"
                >
                  <p className="font-medium text-slate-900">
                    {sol.estudianteNombre}
                  </p>
                  <p className="text-slate-600">{sol.materia}</p>
                  <p className="text-[11px] text-slate-500">
                    {new Date(sol.fechaSolicitud).toLocaleString()}
                  </p>
                  {sol.comentario && (
                    <p className="mt-1 text-[11px] text-slate-600 line-clamp-2">
                      {sol.comentario}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
