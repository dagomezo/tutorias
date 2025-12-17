"use client";

import LoginForm from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        {/* LOGO CENTRADO ARRIBA */}
        <div className="flex justify-center mb-4">
          <img
            src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSb9szLlWzHKbSn3nr2sAX-6mGDjIq1MlpiTA&s"
            alt="Logo ESPE"
            className="h-20 w-auto object-contain drop-shadow-sm"
          />
        </div>

        {/* TÍTULO */}
        <h1 className="text-center text-2xl font-bold text-slate-900">
          Sistema de Tutorías
        </h1>
        <p className="mb-6 text-center text-sm text-slate-500">
          Inicia sesión con tu cuenta
        </p>

        {/* FORM REAL (el que redirige por rol) */}
        <LoginForm />
      </div>
    </div>
  );
}
