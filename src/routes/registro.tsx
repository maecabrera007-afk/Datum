// =============================================================
//  Registro e inicio de sesión (simulados)
// =============================================================
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { Logo, Pagina, Selector } from "@/components/datum/comunes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { iniciarSesion, registrar } from "@/lib/datum/auth";
import { COMUNAS } from "@/lib/datum/catalogo";
import { NOMBRES_SECTOR, type Rol, type Sector } from "@/lib/datum/tipos";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/registro")({
  validateSearch: (s: Record<string, unknown>): { rol: Rol } => ({
    rol: s.rol === "comprador" ? "comprador" : "vendedor",
  }),
  head: () => ({
    meta: [
      { title: "Registro e ingreso — Datum" },
      { name: "description", content: "Crea tu cuenta de negocio o de comprador en Datum, o inicia sesión." },
      { property: "og:title", content: "Registro e ingreso — Datum" },
      { property: "og:description", content: "Crea tu cuenta gratis en Datum en menos de un minuto." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Registro,
});

function Registro() {
  const { rol: rolInicial } = Route.useSearch();
  const navegar = useNavigate();
  const [modo, setModo] = useState<"registro" | "ingreso">("registro");
  const [rol, setRol] = useState<Rol>(rolInicial);
  const [error, setError] = useState<string | null>(null);

  // Campos del formulario
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [clave, setClave] = useState("");
  const [negocio, setNegocio] = useState("");
  const [sector, setSector] = useState<Sector>("tienda_barrio");
  const [comuna, setComuna] = useState("");

  const enviar = (e: FormEvent) => {
    e.preventDefault();
    const r =
      modo === "registro"
        ? registrar({ nombre, correo, clave, rol, negocio, sector, comuna })
        : iniciarSesion(correo, clave);
    if (!r.ok) {
      setError(r.error);
      return;
    }
    toast.success(`¡Hola, ${r.usuario.nombre}!`);
    navegar({ to: r.usuario.rol === "vendedor" ? "/subir" : "/catalogo" });
  };

  return (
    <Pagina className="max-w-xl">
      <Logo className="text-3xl" />
      <h1 className="mt-8 text-4xl font-semibold md:text-5xl">
        {modo === "registro" ? "Crea tu cuenta" : "Bienvenido de nuevo"}
      </h1>
      <p className="mt-3 text-muted-foreground">
        Es una simulación: tus datos se guardan solo en este navegador.
      </p>

      {/* Cambiar entre registro e ingreso */}
      <div className="mt-8 inline-flex rounded-full border p-1" role="tablist">
        {(["registro", "ingreso"] as const).map((m) => (
          <button
            key={m}
            role="tab"
            aria-selected={modo === m}
            onClick={() => {
              setModo(m);
              setError(null);
            }}
            className={cn(
              "cursor-pointer rounded-full px-5 py-2 text-sm transition-colors",
              modo === m ? "bg-primary text-primary-foreground" : "text-muted-foreground",
            )}
          >
            {m === "registro" ? "Registrarme" : "Iniciar sesión"}
          </button>
        ))}
      </div>

      <form onSubmit={enviar} className="mt-8 grid gap-5" noValidate>
        {modo === "registro" && (
          <fieldset className="grid gap-3">
            <legend className="mb-3 text-sm font-medium">¿Qué quieres hacer?</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {(
                [
                  ["vendedor", "Ordenar y vender mis datos", "Tengo una tienda o restaurante"],
                  ["comprador", "Comprar datos", "Soy proveedor, emprendedor o negocio"],
                ] as const
              ).map(([valor, titulo, texto]) => (
                <label
                  key={valor}
                  className={cn(
                    "tarjeta cursor-pointer p-5 transition-colors",
                    rol === valor && "border-foreground bg-primary text-primary-foreground",
                  )}
                >
                  <input
                    type="radio"
                    name="rol"
                    value={valor}
                    checked={rol === valor}
                    onChange={() => setRol(valor)}
                    className="sr-only"
                  />
                  <span className="block font-display text-lg font-medium">{titulo}</span>
                  <span className={cn("mt-1 block text-sm", rol === valor ? "opacity-70" : "text-muted-foreground")}>
                    {texto}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        )}

        {modo === "registro" && (
          <Campo id="nombre" etiqueta="Tu nombre">
            <Input id="nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} autoComplete="name" />
          </Campo>
        )}
        <Campo id="correo" etiqueta="Correo">
          <Input
            id="correo"
            type="email"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            autoComplete="email"
            inputMode="email"
          />
        </Campo>
        <Campo id="clave" etiqueta="Contraseña" ayuda={modo === "registro" ? "Mínimo 6 caracteres." : undefined}>
          <Input
            id="clave"
            type="password"
            value={clave}
            onChange={(e) => setClave(e.target.value)}
            autoComplete={modo === "registro" ? "new-password" : "current-password"}
          />
        </Campo>

        {modo === "registro" && rol === "vendedor" && (
          <>
            <Campo id="negocio" etiqueta="Nombre del negocio">
              <Input id="negocio" value={negocio} onChange={(e) => setNegocio(e.target.value)} />
            </Campo>
            <div className="grid gap-5 sm:grid-cols-2">
              <Campo id="sector" etiqueta="Tipo de negocio">
                <Selector id="sector" value={sector} onChange={(e) => setSector(e.target.value as Sector)}>
                  {Object.entries(NOMBRES_SECTOR).map(([v, t]) => (
                    <option key={v} value={v}>
                      {t}
                    </option>
                  ))}
                </Selector>
              </Campo>
              <Campo id="comuna" etiqueta="Comuna">
                <Selector id="comuna" value={comuna} onChange={(e) => setComuna(e.target.value)}>
                  <option value="">Elige tu comuna</option>
                  {COMUNAS.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </Selector>
              </Campo>
            </div>
          </>
        )}

        {error && (
          <p role="alert" className="rounded-[var(--radius)] border border-destructive/40 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        )}

        <Button type="submit" size="lg" className="mt-2">
          {modo === "registro" ? "Crear cuenta" : "Entrar"}
        </Button>
      </form>
    </Pagina>
  );
}

/** Etiqueta + campo + texto de ayuda */
function Campo({
  id,
  etiqueta,
  ayuda,
  children,
}: {
  id: string;
  etiqueta: string;
  ayuda?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{etiqueta}</Label>
      {children}
      {ayuda && <p className="text-xs text-muted-foreground">{ayuda}</p>}
    </div>
  );
}
