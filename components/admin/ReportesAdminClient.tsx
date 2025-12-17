"use client";

type MateriaReporte = {
  id: number;
  nombre: string;
  totalSesiones: number;
};

type TutorMaloReporte = {
  tutorId: number;
  nombreCompleto: string;
  malas: number;
  promedio: number | null;
};

type Props = {
  topMaterias: MateriaReporte[];
  topTutoresMalos: TutorMaloReporte[];
};

export default function ReportesAdminClient({
  topMaterias,
  topTutoresMalos,
}: Props) {
  const maxSesiones =
    topMaterias.length > 0
      ? Math.max(...topMaterias.map((m) => m.totalSesiones))
      : 0;

  const maxMalas =
    topTutoresMalos.length > 0
      ? Math.max(...topTutoresMalos.map((t) => t.malas))
      : 0;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Top materias más solicitadas */}
      <section className="rounded-2xl border border-indigo-100 bg-white shadow-sm p-5">
        <h2 className="text-sm font-semibold text-slate-900 mb-1">
          Top materias más solicitadas
        </h2>
        <p className="text-[11px] text-slate-500 mb-4">
          Basado en el número de sesiones de tutoría registradas.
        </p>

        {topMaterias.length === 0 ? (
          <p className="text-xs text-slate-500">
            Aún no hay sesiones registradas para calcular este reporte.
          </p>
        ) : (
          <div className="space-y-3">
            {topMaterias.map((m) => {
              const porcentaje =
                maxSesiones > 0
                  ? Math.round((m.totalSesiones / maxSesiones) * 100)
                  : 0;

              return (
                <div key={m.id} className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-medium text-slate-800">
                      {m.nombre}
                    </span>
                    <span className="text-slate-500">
                      {m.totalSesiones} sesión
                      {m.totalSesiones !== 1 ? "es" : ""}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-indigo-50 overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 transition-all"
                      style={{ width: `${porcentaje || 5}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Tutores con más malas calificaciones */}
      <section className="rounded-2xl border border-rose-100 bg-white shadow-sm p-5">
        <h2 className="text-sm font-semibold text-slate-900 mb-1">
          Tutores con más calificaciones bajas
        </h2>
        <p className="text-[11px] text-slate-500 mb-4">
          Tutores que han recibido 3 o más calificaciones menores a 4 sobre 10.
        </p>

        {topTutoresMalos.length === 0 ? (
          <p className="text-xs text-slate-500">
            No se registran tutores con 3 o más calificaciones bajas.
          </p>
        ) : (
          <div className="space-y-3">
            {topTutoresMalos.map((t) => {
              const porcentaje =
                maxMalas > 0
                  ? Math.round((t.malas / maxMalas) * 100)
                  : 0;

              return (
                <div
                  key={t.tutorId}
                  className="rounded-xl border border-rose-100 bg-rose-50/60 px-3 py-2.5 space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-rose-900">
                        {t.nombreCompleto}
                      </p>
                      <p className="text-[11px] text-rose-700">
                        {t.malas} calificaciones &lt; 4
                      </p>
                    </div>

                    <div className="text-right">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          t.promedio !== null && t.promedio < 4
                            ? "bg-rose-600 text-white"
                            : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        Promedio:{" "}
                        {t.promedio !== null
                          ? t.promedio.toFixed(1)
                          : "N/A"}
                      </span>
                    </div>
                  </div>

                  <div className="h-2 rounded-full bg-rose-100 overflow-hidden">
                    <div
                      className="h-full bg-rose-500 transition-all"
                      style={{ width: `${porcentaje || 5}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
