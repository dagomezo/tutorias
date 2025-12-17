import TutoresMateriaClient, {
  MateriaDetalle,
  TutorItem,
} from "@/components/estudiante/TutoresMateriaClient";

type ApiResp = {
  materia: MateriaDetalle | null;
  tutores: TutorItem[];
};

// 🔹 params llega como Promise en Next 16
type PageProps = {
  params: Promise<{ materiaId: string }>;
};

async function getTutoresPorMateria(
  materiaId: string
): Promise<ApiResp> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  try {
    const res = await fetch(
      `${baseUrl}/api/estudiante/materias/${materiaId}/tutores`,
      {
        cache: "no-store",
      }
    );

    if (!res.ok) {
      console.warn(
        "fetch tutores por materia status:",
        res.status
      );
      return { materia: null, tutores: [] };
    }

    const data = (await res.json()) as ApiResp;
    return {
      materia: data.materia ?? null,
      tutores: data.tutores ?? [],
    };
  } catch (e) {
    console.warn("Error de red al obtener tutores por materia", e);
    return { materia: null, tutores: [] };
  }
}

export default async function TutoresMateriaPage({ params }: PageProps) {
  // 👇 AQUÍ está la corrección importante
  const { materiaId } = await params;

  const { materia, tutores } = await getTutoresPorMateria(materiaId);

  return (
    <main className="bg-white min-h-screen">
      <TutoresMateriaClient materia={materia} initialTutores={tutores} />
    </main>
  );
}
