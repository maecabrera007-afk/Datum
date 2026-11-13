// =============================================================
//  Página de inicio: propuesta de valor, 3 pasos y dos caminos
// =============================================================
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Check } from "lucide-react";

import { Barra } from "@/components/datum/comunes";
import { Button } from "@/components/ui/button";
import { PORCENTAJE_VENDEDOR } from "@/lib/datum/compra";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Datum — Datos limpios y un tablero gratis para tu negocio" },
      {
        name: "description",
        content:
          "Sube las ventas de tu tienda o restaurante en Medellín y recibe gratis datos ordenados, un puntaje de calidad y un tablero. Si quieres, compártelos de forma anónima y gana dinero.",
      },
      { property: "og:title", content: "Datum — Datos limpios y un tablero gratis para tu negocio" },
      {
        property: "og:description",
        content: "Convierte un CSV desordenado en datos confiables con puntaje de calidad. Para tiendas y restaurantes de Medellín.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Inicio,
});

const PASOS = [
  {
    numero: "01",
    titulo: "Sube tu archivo",
    texto: "Exporta tus ventas a CSV desde Excel o tu caja registradora y súbelo desde el celular.",
  },
  {
    numero: "02",
    titulo: "Lo ordenamos por ti",
    texto: "Arreglamos fechas, precios, mayúsculas y duplicados. Te mostramos el antes y el después.",
  },
  {
    numero: "03",
    titulo: "Mira y decide",
    texto: "Recibe un puntaje de calidad y un tablero. Si quieres, publica una versión anónima y gana dinero.",
  },
];

// Ejemplo visual de la "tarjeta de puntaje" (decorativa)
const MUESTRA = [
  { nombre: "Completitud", valor: 96 },
  { nombre: "Sin duplicados", valor: 94 },
  { nombre: "Consistencia", valor: 91 },
  { nombre: "Valores normales", valor: 98 },
];

function Inicio() {
  return (
    <main>
      {/* ---------- Portada ---------- */}
      <section className="relative overflow-hidden border-b">
        <div className="fondo-reticula pointer-events-none absolute inset-0 opacity-40 [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" />
        <div className="relative mx-auto grid max-w-6xl gap-14 px-5 pb-20 pt-16 md:grid-cols-[1.3fr_1fr] md:px-8 md:pb-28 md:pt-24">
          <div className="aparecer">
            <p className="eyebrow mb-6">Para tiendas de barrio y restaurantes de Medellín</p>
            <h1 className="text-5xl font-semibold leading-[0.98] md:text-7xl lg:text-8xl">
              Tus ventas, por fin en{" "}
              <span className="relative whitespace-nowrap">
                <span className="relative z-10">orden.</span>
                <span aria-hidden className="absolute inset-x-0 bottom-1 z-0 h-4 bg-accent md:h-6" />
              </span>
            </h1>
            <p className="mt-8 max-w-xl text-lg text-muted-foreground md:text-xl">
              Sube tu archivo desordenado y recibe gratis datos limpios, un puntaje de calidad y un tablero
              fácil de entender.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link to="/registro" search={{ rol: "vendedor" }}>
                  Quiero ordenar y vender mis datos <ArrowRight />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/catalogo">Quiero comprar datos</Link>
              </Button>
            </div>
          </div>

          {/* Tarjeta de ejemplo */}
          <div className="aparecer self-end [animation-delay:150ms]" aria-hidden>
            <div className="tarjeta p-6 md:p-8">
              <div className="flex items-start justify-between">
                <div>
                  <p className="eyebrow">Puntaje de calidad</p>
                  <p className="cifra mt-2 text-7xl font-semibold">
                    94<span className="text-2xl text-muted-foreground">/100</span>
                  </p>
                </div>
                <span className="rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                  ventas_mayo.csv
                </span>
              </div>
              <ul className="mt-8 grid gap-4">
                {MUESTRA.map((m) => (
                  <li key={m.nombre} className="grid gap-1.5">
                    <div className="flex justify-between text-sm">
                      <span>{m.nombre}</span>
                      <span className="cifra">{m.valor}</span>
                    </div>
                    <Barra valor={m.valor} />
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-3 flex items-center gap-3 rounded-[var(--radius)] bg-primary p-5 text-primary-foreground">
              <span className="cifra text-3xl font-semibold text-accent">412</span>
              <span className="text-sm opacity-80">cambios hechos automáticamente: fechas, precios, espacios y duplicados.</span>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Cómo funciona ---------- */}
      <section className="mx-auto max-w-6xl px-5 py-20 md:px-8 md:py-28">
        <p className="eyebrow mb-4">Cómo funciona</p>
        <h2 className="max-w-2xl text-4xl font-semibold md:text-5xl">Tres pasos. Sin saber de tecnología.</h2>
        <ol className="mt-14 grid gap-px overflow-hidden rounded-[var(--radius)] border bg-border md:grid-cols-3">
          {PASOS.map((p) => (
            <li key={p.numero} className="bg-background p-8">
              <span className="cifra text-sm text-muted-foreground">{p.numero}</span>
              <h3 className="mt-10 text-2xl font-semibold">{p.titulo}</h3>
              <p className="mt-3 text-muted-foreground">{p.texto}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ---------- Confianza ---------- */}
      <section className="bg-primary text-primary-foreground">
        <div className="mx-auto grid max-w-6xl gap-12 px-5 py-20 md:grid-cols-2 md:px-8 md:py-28">
          <div>
            <p className="eyebrow mb-4">Tus datos, tus reglas</p>
            <h2 className="text-4xl font-semibold md:text-5xl">
              Compartir es opcional. Y siempre <span className="text-accent">anónimo.</span>
            </h2>
          </div>
          <ul className="grid gap-5 self-end">
            {[
              "Nunca publicamos tus ventas una por una: solo totales por mes y categoría.",
              "Quitamos nombres, cédulas, teléfonos y correos antes de compartir.",
              `Recibes el ${PORCENTAJE_VENDEDOR * 100} % de cada venta de tu dataset.`,
              "Puedes retirar tu dataset del catálogo cuando quieras.",
            ].map((t) => (
              <li key={t} className="flex gap-3 border-b border-primary-foreground/15 pb-5">
                <Check className="mt-0.5 size-5 shrink-0 text-accent" />
                <span className="opacity-90">{t}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ---------- Para compradores ---------- */}
      <section className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-5 py-20 md:flex-row md:items-end md:justify-between md:px-8 md:py-28">
        <div className="max-w-xl">
          <p className="eyebrow mb-4">Para proveedores y emprendedores</p>
          <h2 className="text-4xl font-semibold md:text-5xl">Datos de barrio que puedes confiar.</h2>
          <p className="mt-4 text-muted-foreground">
            Cada dataset trae su puntaje de calidad, una muestra y la fórmula de su precio.
          </p>
        </div>
        <Button asChild size="lg" variant="acento">
          <Link to="/catalogo">
            Ver el catálogo <ArrowRight />
          </Link>
        </Button>
      </section>
    </main>
  );
}
