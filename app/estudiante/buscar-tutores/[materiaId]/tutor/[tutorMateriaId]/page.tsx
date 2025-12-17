import HorariosTutorMateriaClient, {
  TutorMateriaDetalle,
  DisponibilidadBase,
} from "@/components/estudiante/HorariosTutorMateriaClient";

type ApiResp = {
  detalle: TutorMateriaDetalle;
  disponibilidad: DisponibilidadBase[];
};

// params es Promise en Next 16
type PageProps = {
  params: Promise<{ materiaId: string; tutorMateriaId: string }>;
};

async function getDetalleYHorarios(
  tutorMateriaId: string
): Promise<ApiResp | null> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  try {
    const res = await fetch(
      `${baseUrl}/api/estudiante/tutor-materia/${tutorMateriaId}/horarios`,
      { cache: "no-store" }
    );

    if (!res.ok) {
      console.warn(
        "Error fetch /api/estudiante/tutor-materia/[tutorMateriaId]/horarios",
        res.status
      );
      return null;
    }

    const data = (await res.json()) as ApiResp;
    return data;
  } catch (e) {
    console.warn("Error de red al obtener horarios del tutor", e);
    return null;
  }
}

export default async function HorariosTutorPage({ params }: PageProps) {
  const { tutorMateriaId } = await params;

  const data = await getDetalleYHorarios(tutorMateriaId);

  if (!data) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-sm text-slate-500">
          No se pudo cargar la información del tutor.
        </p>
      </main>
    );
  }

  return (
    <main className="bg-white min-h-screen">
      <HorariosTutorMateriaClient
        detalle={data.detalle}
        disponibilidad={data.disponibilidad}
      />
    </main>
  );
}
