"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: { sitekey: string; callback: (token: string) => void }
      ) => string;
      reset: (widgetId?: string) => void;
    };
  }
}

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js";

let scriptPromise: Promise<void> | null = null;

function loadScript(nonce?: string): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.turnstile) return Promise.resolve();
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      if (nonce) script.nonce = nonce;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("No se pudo cargar Turnstile"));
      document.head.appendChild(script);
    });
  }
  return scriptPromise;
}

type Props = {
  nonce?: string;
  onVerify: (token: string) => void;
};

// Si NEXT_PUBLIC_TURNSTILE_SITE_KEY no está seteada, no renderiza nada — el
// formulario que lo use sigue funcionando (la verificación server-side en
// src/lib/turnstile.ts también queda inactiva en ese caso).
export default function TurnstileWidget({ nonce, onVerify }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!SITE_KEY || !containerRef.current) return;
    let cancelled = false;

    loadScript(nonce)
      .then(() => {
        if (cancelled || !containerRef.current || !window.turnstile) return;
        window.turnstile.render(containerRef.current, {
          sitekey: SITE_KEY,
          callback: onVerify,
        });
      })
      .catch((err) => console.error("[turnstile]", err));

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!SITE_KEY) return null;

  return <div ref={containerRef} className="my-1" />;
}
