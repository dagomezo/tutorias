import SolicitudesTutorClient from "@/components/tutor/SolicitudesTutorClient";

export default function TutorSolicitudesPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <h1 className="text-lg font-semibold text-slate-900 mb-1">
        Solicitudes recibidas
      </h1>
      <p className="text-xs text-slate-500 mb-4">
        Revisa las solicitudes de tutoría que los estudiantes han enviado y
        acepta o rechaza según tu disponibilidad.
      </p>

      <SolicitudesTutorClient />
    </main>
  );
}

