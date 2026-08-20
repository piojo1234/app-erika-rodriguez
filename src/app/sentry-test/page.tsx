"use client";

import React from "react";

export default function SentryTestPage() {
  const triggerClientError = () => {
    throw new Error("Sentry Test Error: Este es un error en el cliente.");
  };

  const triggerServerError = async () => {
    await fetch("/api/sentry-test-api", { method: "POST" });
  };

  return (
    <div style={{ padding: "40px", fontFamily: "sans-serif", maxWidth: "600px", margin: "auto" }}>
      <h1 style={{ fontSize: "24px", marginBottom: "20px" }}>Prueba de Integración de Sentry</h1>
      <p style={{ marginBottom: "20px" }}>
        Utiliza los siguientes botones para provocar errores y verificar si Sentry los está capturando correctamente.
      </p>

      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <button
          onClick={triggerClientError}
          style={{
            padding: "10px 20px",
            backgroundColor: "#e53e3e",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          Lanzar Error en el Cliente
        </button>

        <button
          onClick={triggerServerError}
          style={{
            padding: "10px 20px",
            backgroundColor: "#dd6b20",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          Lanzar Error en el Servidor (API)
        </button>
      </div>

      <p style={{ fontSize: "14px", color: "#666" }}>
        Asegúrate de tener configurada la variable <code>NEXT_PUBLIC_SENTRY_DSN</code> en el archivo <code>.env</code>.
      </p>
    </div>
  );
}
