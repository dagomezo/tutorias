"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

// 🔹 Validador de cédula en el CLIENTE (mismo algoritmo)
function validarCedulaEcuador(cedula: string): boolean {
  const c = cedula.trim();
  if (!/^\d{10}$/.test(c)) return false;

  const provincia = parseInt(c.slice(0, 2), 10);
  if (!((provincia >= 1 && provincia <= 24) || provincia === 30)) return false;

  const tercer = parseInt(c[2], 10);
  if (tercer >= 6) return false;

  const coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2];
  let suma = 0;

  for (let i = 0; i < 9; i++) {
    let valor = parseInt(c[i], 10) * coeficientes[i];
    if (valor >= 10) valor -= 9;
    suma += valor;
  }

  const modulo = suma % 10;
  const digitoVerificador = modulo === 0 ? 0 : 10 - modulo;

  return digitoVerificador === parseInt(c[9], 10);
}

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    email: "",
    password: "",
    cedula: "",
    telefono: "",
    carrera: "",
    ciclo: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [cedulaError, setCedulaError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    if (name === "cedula") {
      if (value.length === 0) {
        setCedulaError("");
      } else if (!validarCedulaEcuador(value)) {
        setCedulaError("Cédula ecuatoriana no válida");
      } else {
        setCedulaError("");
      }
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validarCedulaEcuador(form.cedula)) {
      setCedulaError("Cédula ecuatoriana no válida");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      let data: any = null;

      // ⛑ Intentar parsear JSON, pero si viene HTML evitamos el “Unexpected token '<'”
      try {
        data = await res.json();
      } catch {
        throw new Error(
          "Respuesta inesperada del servidor. Intenta nuevamente más tarde."
        );
      }

      if (!res.ok) {
        throw new Error(data?.message || "Error al registrar");
      }

      if (typeof window !== "undefined" && data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
      }

      router.push("/estudiante/buscar-tutores");
    } catch (err: any) {
      console.error("Error en registro (frontend):", err);
      setError(err.message || "Ocurrió un error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
      >
        <h1 className="mb-2 text-2xl font-bold text-slate-900">
          Registro de estudiante
        </h1>
        <p className="mb-4 text-sm text-slate-500">
          Crea tu cuenta para poder solicitar tutorías.
        </p>

        {error && (
          <div className="mb-3 rounded-lg bg-red-100 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Fuerza texto negro en los inputs */}
        <style jsx>{`
          input {
            color: #0f172a !important;
          }
          input::placeholder {
            color: #94a3b8 !important;
          }
        `}</style>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">
              Nombre
            </label>
            <input
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              required
              placeholder="Juan"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-600">
              Apellido
            </label>
            <input
              name="apellido"
              value={form.apellido}
              onChange={handleChange}
              required
              placeholder="Pérez"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
          </div>
        </div>

        <div className="mt-3">
          <label className="mb-1 block text-xs font-semibold text-slate-600">
            Correo institucional
          </label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
            placeholder="tu@espe.edu.ec"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        <div className="mt-3">
          <label className="mb-1 block text-xs font-semibold text-slate-600">
            Contraseña
          </label>
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            required
            placeholder="••••••••"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        <div className="mt-3">
          <label className="mb-1 block text-xs font-semibold text-slate-600">
            Cédula
          </label>
          <input
            name="cedula"
            value={form.cedula}
            onChange={handleChange}
            required
            placeholder="1728394561"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
          {cedulaError && (
            <p className="mt-1 text-xs text-red-600">{cedulaError}</p>
          )}
        </div>

        <div className="mt-3">
          <label className="mb-1 block text-xs font-semibold text-slate-600">
            Carrera (opcional)
          </label>
          <input
            name="carrera"
            value={form.carrera}
            onChange={handleChange}
            placeholder="Ingeniería en Software"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        <div className="mt-3">
          <label className="mb-1 block text-xs font-semibold text-slate-600">
            Ciclo / semestre (opcional)
          </label>
          <input
            name="ciclo"
            value={form.ciclo}
            onChange={handleChange}
            placeholder="3er semestre"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        <div className="mt-3">
          <label className="mb-1 block text-xs font-semibold text-slate-600">
            Teléfono (opcional)
          </label>
          <input
            name="telefono"
            value={form.telefono}
            onChange={handleChange}
            placeholder="+593 9..."
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-full bg-indigo-600 py-2 text-sm font-medium text-white shadow-md transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Registrando..." : "Registrarse"}
        </button>

        <p className="mt-3 text-center text-xs text-slate-500">
          ¿Ya tienes cuenta?{" "}
          <span
            onClick={() => router.push("/login")}
            className="cursor-pointer font-semibold text-indigo-600 hover:underline"
          >
            Inicia sesión
          </span>
        </p>
      </form>
    </div>
  );
}
