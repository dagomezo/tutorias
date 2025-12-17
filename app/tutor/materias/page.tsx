import MateriasTutorClient from "@/components/tutor/MateriasTutorClient";

export default function TutorMateriasPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">
          Mis materias
        </h1>
        <p className="text-xs text-slate-500">
          Revisa las materias que dictas y gestiona tu disponibilidad de horarios.
        </p>
      </div>

      <MateriasTutorClient />
    </div>
  );
}
                    