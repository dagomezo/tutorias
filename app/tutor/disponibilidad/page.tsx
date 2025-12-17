import pool from "@/lib/db";

type Franja = {
  id: number;
  diaSemana: string;
  horaInicio: string;
  horaFin: string;
};

async function getDisponibilidad(tutorId: number) {
  const [rows] = await pool.query(
    `
    SELECT id, dia_semana AS diaSemana, hora_inicio AS horaInicio, hora_fin AS horaFin
    FROM disponibilidad_tutor
    WHERE tutor_id = ?
    ORDER BY FIELD(dia_semana, 'LUNES','MARTES','MIERCOLES','JUEVES','VIERNES','SABADO','DOMINGO'), hora_inicio
    `,
    [tutorId]
  );

  return rows as Franja[];
}

export default async function TutorDisponibilidadPage() {
  const tutorId = 1;
  const franjas = await getDisponibilidad(tutorId);

  return (
    <div className="space-y-8">
      <section className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5">
        <h2 className="text-sm font-semibold text-slate-900 mb-4">
          Mi disponibilidad semanal
        </h2>

        {franjas.length === 0 ? (
          <p className="text-xs text-slate-500">
            Aún no has definido horarios de disponibilidad.
          </p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 text-xs">
            {franjas.map((f) => (
              <div
                key={f.id}
                className="rounded-lg border border-slate-200 px-3 py-2 flex items-center justify-between"
              >
                <div>
                  <p className="font-medium text-slate-900">
                    {f.diaSemana}
                  </p>
                  <p className="text-slate-600">
                    {f.horaInicio.slice(0, 5)} – {f.horaFin.slice(0, 5)}
                  </p>
                </div>
                <div className="space-x-2">
                  <button className="text-indigo-600 hover:underline">
                    Editar
                  </button>
                  <button className="text-red-600 hover:underline">
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Formulario simple para crear franja (solo UI) */}
      <section className="rounded-2xl bg-white border border-slate-200 shadow-sm p-5 text-xs">
        <h2 className="text-sm font-semibold text-slate-900 mb-4">
          Agregar franja horaria
        </h2>
        <form className="grid gap-4 sm:grid-cols-[1.5fr,1fr,1fr,auto] items-end">
          <div>
            <label className="block mb-1 text-slate-600">
              Día de la semana
            </label>
            <select className="w-full rounded-md border border-slate-300 px-2 py-2 text-xs">
              <option value="">Selecciona un día</option>
              <option value="LUNES">Lunes</option>
              <option value="MARTES">Martes</option>
              <option value="MIERCOLES">Miércoles</option>
              <option value="JUEVES">Jueves</option>
              <option value="VIERNES">Viernes</option>
              <option value="SABADO">Sábado</option>
              <option value="DOMINGO">Domingo</option>
            </select>
          </div>

          <div>
            <label className="block mb-1 text-slate-600">
              Hora inicio
            </label>
            <input
              type="time"
              className="w-full rounded-md border border-slate-300 px-2 py-2 text-xs"
            />
          </div>

          <div>
            <label className="block mb-1 text-slate-600">
              Hora fin
            </label>
            <input
              type="time"
              className="w-full rounded-md border border-slate-300 px-2 py-2 text-xs"
            />
          </div>

          <button
            type="button"
            className="rounded-md bg-indigo-600 text-white px-4 py-2 text-xs font-medium hover:bg-indigo-700"
          >
            Agregar
          </button>
        </form>
      </section>
    </div>
  );
}
