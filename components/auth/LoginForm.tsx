"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

export default function LoginForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const form = new FormData(e.currentTarget);
      const email = String(form.get("email") ?? "").trim();
      const password = String(form.get("password") ?? "").trim();

      if (!email || !password) {
        setError("Faltan campos obligatorios");
        setLoading(false);
        return;
      }

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message || "Error al iniciar sesión");
      }

      if (typeof window !== "undefined" && data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
      }

      const rol = data.user?.rol as string | undefined;

      if (rol === "ADMIN") window.location.href = "/admin/dashboard";
      else if (rol === "TUTOR") window.location.href = "/tutor/dashboard";
      else if (rol === "ESTUDIANTE") window.location.href = "/estudiante/buscar-tutores";
      else window.location.href = "/";
    } catch (err: any) {
      setError(err.message || "Ocurrió un error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {error && (
        <div className="rounded-md bg-red-100 text-red-700 px-3 py-2 text-sm">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Correo institucional
        </label>
        <input
          name="email"
          type="email"
          required
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="tucorreo@universidad.edu"
          autoComplete="email"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Contraseña
        </label>
        <input
          name="password"
          type="password"
          required
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="••••••••"
          autoComplete="current-password"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loading ? "Ingresando..." : "Iniciar sesión"}
      </button>

      <p className="text-xs text-center text-slate-500">
        ¿Olvidaste tu contraseña?
      </p>

      <p className="text-sm text-center text-slate-600">
        ¿No tienes cuenta?{" "}
        <Link href="/login/register" className="text-indigo-600 hover:underline font-semibold">
          Registrarse
        </Link>
      </p>
    </form>
  );
}
