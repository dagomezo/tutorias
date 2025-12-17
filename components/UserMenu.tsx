"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

type UsuarioLS = {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  rol: string;
  imagen_perfil?: string | null;
};

export default function UserMenu() {
  const [user, setUser] = useState<UsuarioLS | null>(null);
  const [open, setOpen] = useState(false);

  // Leer SIEMPRE desde localStorage al montar
  useEffect(() => {
    try {
      const raw = localStorage.getItem("user");
      if (!raw) return;
      const parsed = JSON.parse(raw) as UsuarioLS;
      setUser(parsed);
    } catch (e) {
      console.error("Error leyendo usuario desde localStorage", e);
    }
  }, []);

  const initials = `${user?.nombre?.[0] ?? ""}${user?.apellido?.[0] ?? ""}`.toUpperCase();

  return (
    <div className="relative">
      {/* Botón avatar (esquina superior, el layout lo posiciona con flex) */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 shadow-sm hover:bg-slate-50 transition"
      >
        <div className="h-9 w-9 rounded-full bg-indigo-600 text-white flex items-center justify-center font-semibold overflow-hidden">
          {user?.imagen_perfil ? (
            <Image
              src={user.imagen_perfil}
              alt="Perfil"
              width={36}
              height={36}
              className="h-9 w-9 rounded-full object-cover"
            />
          ) : (
            initials || "?"
          )}
        </div>
      </button>

      {/* Menú desplegable */}
      {open && (
        <div className="absolute right-0 mt-2 w-64 rounded-xl border border-slate-200 bg-white shadow-lg p-4 space-y-3 z-50">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
            <div className="h-10 w-10 flex items-center justify-center rounded-full bg-indigo-600 text-white font-bold">
              {initials || "?"}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">
                {user ? `${user.nombre} ${user.apellido}` : "Invitado"}
              </p>
              <p className="text-xs text-slate-500">
                {user?.email ?? "Sin email"}
              </p>
              {user?.rol && (
                <p className="mt-0.5 inline-flex rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-700">
                  {user.rol}
                </p>
              )}
            </div>
          </div>

          <button
            onClick={() => {
              localStorage.removeItem("user");
              window.location.href = "/login";
            }}
            className="w-full text-left text-xs font-medium text-red-600 hover:text-red-700"
          >
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}
