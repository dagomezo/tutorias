import BuscarMateriasClient, {
  MateriaItem,
} from "@/components/estudiante/BuscarMateriasClient";

async function getMaterias(): Promise<MateriaItem[]> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  try {
    const res = await fetch(`${baseUrl}/api/estudiante/materias`, {
      cache: "no-store",
    });

    if (!res.ok) {
      console.error("Error fetch /api/estudiante/materias", res.status);
      return [];
    }

    const data = await res.json();
    return (data.materias || []) as MateriaItem[];
  } catch (e) {
    console.error("Error de red al obtener materias", e);
    return [];
  }
}

export default async function BuscarTutoresPage() {
  const materias = await getMaterias();

  return (
    <main className="bg-white min-h-screen">
      <BuscarMateriasClient initialMaterias={materias} />
    </main>
  );
}
