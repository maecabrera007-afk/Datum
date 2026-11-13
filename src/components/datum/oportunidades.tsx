// =============================================================
//  Pestaña Oportunidades: índice transparente, top 5, ranking por
//  tipo de negocio y comparador de zonas. Datos ilustrativos.
// =============================================================
import { ArrowRight, Columns2, Info, MapPin, ShieldAlert, X } from "lucide-react";
import { useState } from "react";

import { Barra, Selector } from "@/components/datum/comunes";
import { Button } from "@/components/ui/button";
import { numero, pesos } from "@/lib/datum/formato";
import {
  DIAS_LARGOS,
  diaPico,
  etiquetaZona,
  franjaLegible,
  horaPico,
  indiceOportunidad,
  LISTA_TIPOS,
  MINIMO_NEGOCIOS_ZONA,
  PESO_AFLUENCIA,
  PESO_VENTAS,
  rankingOportunidades,
  TIPOS_NEGOCIO,
  topOportunidades,
  ventasNormalizadas,
  ZONAS,
  ZONAS_VISIBLES,
  zonaProtegida,
  demanda,
  type Oportunidad,
  type TipoNegocio,
  type Zona,
} from "@/lib/datum/zonas";
import { cn } from "@/lib/utils";

const AVISO_TARJETA = "Sugerencia basada en datos ilustrativos, no es asesoría financiera";
const zonaMayorVenta = ZONAS_VISIBLES.reduce((a, b) => (b.ventas_promedio_mensual > a.ventas_promedio_mensual ? b : a));

export function PestanaOportunidades({
  tipo,
  setTipo,
  seleccionada,
  onVerEnMapa,
  onVerDatasets,
}: {
  tipo: TipoNegocio | null;
  setTipo: (t: TipoNegocio | null) => void;
  seleccionada: Zona | null;
  onVerEnMapa: (z: Zona) => void;
  onVerDatasets: (z: Zona) => void;
}) {
  const [comparando, setComparando] = useState(false);
  const top = topOportunidades(5, tipo);
  const ranking = rankingOportunidades(tipo);
  const protegidas = ZONAS.filter(zonaProtegida);

  if (ZONAS.length === 0)
    return <p className="tarjeta p-8 text-muted-foreground">No pudimos cargar los datos de las zonas. Recarga la página.</p>;

  return (
    <div className="grid gap-12">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="grid gap-3">
          <p className="inline-flex items-center gap-2 self-start rounded-full bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground">
            <Info className="size-3.5 text-accent" aria-hidden /> Datos ilustrativos de demostración
          </p>
          <h2 className="text-3xl font-semibold md:text-4xl">¿Dónde abrir un negocio?</h2>
          <p className="max-w-2xl text-muted-foreground">
            Un índice de 0 a 100 por zona y tipo de negocio: más alto cuando hay muchos compradores y pocos negocios
            iguales.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="grid gap-1.5">
            <label htmlFor="o-tipo" className="eyebrow">
              Tipo de negocio
            </label>
            <Selector
              id="o-tipo"
              className="sm:w-64"
              value={tipo ?? "todos"}
              onChange={(e) => setTipo(e.target.value === "todos" ? null : (e.target.value as TipoNegocio))}
            >
              <option value="todos">Todos (mejor tipo por zona)</option>
              {LISTA_TIPOS.map((t) => (
                <option key={t} value={t}>
                  {TIPOS_NEGOCIO[t]}
                </option>
              ))}
            </Selector>
          </div>
          <Button variant={comparando ? "default" : "outline"} onClick={() => setComparando(!comparando)} aria-expanded={comparando}>
            <Columns2 /> Comparar zonas
          </Button>
        </div>
      </div>

      {comparando && <Comparador inicial={seleccionada} alCerrar={() => setComparando(false)} />}

      <Formula ejemplo={top[0]} />

      {seleccionada && <ZonaElegida zona={seleccionada} tipo={tipo} />}

      <section aria-labelledby="titulo-top">
        <h3 id="titulo-top" className="text-2xl font-semibold">
          Top 5 oportunidades{tipo ? ` para ${TIPOS_NEGOCIO[tipo].toLowerCase()}` : ""}
        </h3>
        <ol className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {top.map((o, i) => (
            <li key={o.zona.id}>
              <TarjetaOportunidad o={o} puesto={i + 1} onVerEnMapa={onVerEnMapa} onVerDatasets={onVerDatasets} />
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="titulo-ranking">
        <h3 id="titulo-ranking" className="text-2xl font-semibold">
          {tipo ? `Mejores zonas para abrir: ${TIPOS_NEGOCIO[tipo].toLowerCase()}` : "Todas las zonas, con su mejor tipo de negocio"}
        </h3>
        <ol className="mt-6 grid gap-x-10 gap-y-4 md:grid-cols-2">
          {ranking.map((o, i) => (
            <li key={o.zona.id} className="grid gap-1.5">
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="min-w-0 truncate">
                  <span className="cifra mr-2 text-muted-foreground">{i + 1}</span>
                  <button type="button" className="cursor-pointer font-medium hover:underline" onClick={() => onVerEnMapa(o.zona)}>
                    {o.zona.nombre}
                  </button>
                  {!tipo && <span className="text-muted-foreground"> · {TIPOS_NEGOCIO[o.tipo]}</span>}
                </span>
                <span className="cifra shrink-0 font-semibold">{o.indice}/100</span>
              </div>
              <Barra valor={o.indice} resaltar={i === 0} />
            </li>
          ))}
        </ol>
        <p className="mt-6 flex items-start gap-2 text-xs text-muted-foreground">
          <ShieldAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          No aparecen {protegidas.map((z) => z.nombre).join(", ")}: tienen menos de {MINIMO_NEGOCIOS_ZONA} negocios
          aportando datos y sus cifras se ocultan para proteger la privacidad.
        </p>
      </section>
    </div>
  );
}

// ---------------- Fórmula transparente ----------------
function Formula({ ejemplo }: { ejemplo: Oportunidad | undefined }) {
  return (
    <section aria-labelledby="titulo-formula" className="grid gap-6 rounded-[var(--radius)] bg-primary p-6 text-primary-foreground md:grid-cols-[1.2fr_1fr] md:p-8">
      <div>
        <p className="eyebrow text-primary-foreground/60">Cómo se calcula</p>
        <h3 id="titulo-formula" className="mt-2 text-2xl font-semibold">
          Índice de oportunidad = <span className="text-accent">Demanda − Saturación</span>
        </h3>
        <ul className="mt-5 grid gap-3 text-sm opacity-90">
          <li>
            <strong>Demanda (0–100)</strong> = {PESO_AFLUENCIA * 100} % afluencia de compradores + {PESO_VENTAS * 100} %
            ventas promedio por negocio. Las ventas se pasan a 0–100 frente a la zona que más vende ({zonaMayorVenta.nombre}).
          </li>
          <li>
            <strong>Saturación (0–100)</strong> = negocios de ese tipo en la zona frente a la zona que más tiene de ese
            tipo. Si una zona tiene la mayor cantidad de cafés, su saturación para cafés es 100.
          </li>
          <li>El resultado se limita entre 0 y 100. Las zonas con menos de {MINIMO_NEGOCIOS_ZONA} negocios no se calculan.</li>
        </ul>
      </div>
      {ejemplo && (
        <div className="rounded-[var(--radius)] border border-primary-foreground/20 p-5 text-sm">
          <p className="eyebrow text-primary-foreground/60">Ejemplo</p>
          <p className="mt-2 font-medium">
            {TIPOS_NEGOCIO[ejemplo.tipo]} en {ejemplo.zona.nombre}
          </p>
          <dl className="mt-4 grid gap-2">
            <Fila t="Afluencia" v={`${ejemplo.zona.indice_afluencia}/100`} />
            <Fila t="Ventas (0–100)" v={`${ventasNormalizadas(ejemplo.zona)}/100`} />
            <Fila
              t="Demanda"
              v={`${PESO_AFLUENCIA} × ${ejemplo.zona.indice_afluencia} + ${PESO_VENTAS} × ${ventasNormalizadas(ejemplo.zona)} = ${ejemplo.demanda}`}
            />
            <Fila t="Saturación" v={`${ejemplo.saturacion}`} />
          </dl>
          <p className="cifra mt-4 border-t border-primary-foreground/20 pt-4 text-lg">
            {ejemplo.demanda} − {ejemplo.saturacion} = <span className="text-3xl font-semibold text-accent">{ejemplo.indice}</span>
          </p>
        </div>
      )}
    </section>
  );
}

const Fila = ({ t, v }: { t: string; v: string }) => (
  <div className="flex justify-between gap-4">
    <dt className="opacity-70">{t}</dt>
    <dd className="cifra text-right">{v}</dd>
  </div>
);

// ---------------- Zona elegida (la misma del mapa y de Datasets) ----------------
function ZonaElegida({ zona, tipo }: { zona: Zona; tipo: TipoNegocio | null }) {
  return (
    <section className="tarjeta p-6" aria-live="polite">
      <p className="eyebrow">Zona seleccionada · {etiquetaZona(zona)}</p>
      <p className="mt-2 font-display text-2xl font-semibold">{zona.nombre}</p>
      {zonaProtegida(zona) ? (
        <p className="mt-3 text-sm">Datos insuficientes para proteger la privacidad.</p>
      ) : (
        <ul className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-4">
          {LISTA_TIPOS.map((t) => {
            const indice = indiceOportunidad(zona, t);
            return (
              <li key={t} className={cn("grid gap-2 rounded-[var(--radius)] border p-4", tipo === t && "border-foreground")}>
                <span className="text-sm">{TIPOS_NEGOCIO[t]}</span>
                <span className="cifra text-3xl font-semibold">{indice}</span>
                <Barra valor={indice} />
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

// ---------------- Tarjeta de oportunidad ----------------
function TarjetaOportunidad({
  o,
  puesto,
  onVerEnMapa,
  onVerDatasets,
}: {
  o: Oportunidad;
  puesto: number;
  onVerEnMapa: (z: Zona) => void;
  onVerDatasets: (z: Zona) => void;
}) {
  return (
    <article className="tarjeta flex h-full flex-col gap-5 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="eyebrow">
            #{puesto} · {etiquetaZona(o.zona)}
          </p>
          <h4 className="mt-2 text-xl font-semibold leading-tight">{TIPOS_NEGOCIO[o.tipo]}</h4>
          <p className="text-sm text-muted-foreground">en {o.zona.nombre}</p>
        </div>
        <div className="shrink-0 rounded-[var(--radius)] bg-primary px-3 py-2 text-center text-primary-foreground">
          <span className="cifra block text-3xl font-semibold text-accent">{o.indice}</span>
          <span className="text-[10px] uppercase tracking-wider opacity-70">índice</span>
        </div>
      </div>
      <p className="cifra text-xs text-muted-foreground">
        Demanda {o.demanda} − saturación {o.saturacion}
      </p>
      <ul className="grid gap-2 text-sm">
        {o.razones.map((r) => (
          <li key={r} className="flex gap-2">
            <ArrowRight className="mt-0.5 size-3.5 shrink-0" aria-hidden /> {r}
          </li>
        ))}
      </ul>
      <p className="mt-auto flex items-start gap-2 border-t pt-4 text-xs text-muted-foreground">
        <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden /> {AVISO_TARJETA}
      </p>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={() => onVerEnMapa(o.zona)}>
          <MapPin /> Ver en el mapa
        </Button>
        <Button size="sm" variant="ghost" onClick={() => onVerDatasets(o.zona)}>
          Ver datasets
        </Button>
      </div>
    </article>
  );
}

// ---------------- Comparador de 2 zonas ----------------
function Comparador({ inicial, alCerrar }: { inicial: Zona | null; alCerrar: () => void }) {
  const primera = inicial && !zonaProtegida(inicial) ? inicial : (topOportunidades(1)[0]?.zona ?? ZONAS_VISIBLES[0]);
  const segunda = ZONAS_VISIBLES.find((z) => z.id !== primera?.id);
  const [a, setA] = useState(primera?.id ?? "");
  const [b, setB] = useState(segunda?.id ?? "");
  const za = ZONAS.find((z) => z.id === a);
  const zb = ZONAS.find((z) => z.id === b);

  const filas: { t: string; v: (z: Zona) => string; n?: (z: Zona) => number }[] = [
    { t: "Negocios registrados", v: (z) => numero(z.negocios_registrados), n: (z) => z.negocios_registrados },
    { t: "Afluencia de compradores", v: (z) => `${z.indice_afluencia}/100`, n: (z) => z.indice_afluencia },
    { t: "Ventas promedio por negocio", v: (z) => `${pesos(z.ventas_promedio_mensual)} / mes`, n: (z) => z.ventas_promedio_mensual },
    { t: "Ticket promedio", v: (z) => pesos(z.ticket_promedio), n: (z) => z.ticket_promedio },
    { t: "Crecimiento trimestral", v: (z) => `${numero(z.crecimiento_trimestral, 1)} %`, n: (z) => z.crecimiento_trimestral },
    { t: "Hora de mayor afluencia", v: (z) => franjaLegible(horaPico(z).franja) },
    { t: "Día más fuerte", v: (z) => DIAS_LARGOS[diaPico(z)] ?? "" },
    { t: "Categoría más vendida", v: (z) => z.categoria_mas_vendida },
    { t: "Demanda", v: (z) => `${demanda(z)}/100`, n: (z) => demanda(z) },
    ...LISTA_TIPOS.map((t) => ({
      t: `Índice: ${TIPOS_NEGOCIO[t].toLowerCase()}`,
      v: (z: Zona) => `${indiceOportunidad(z, t)}/100`,
      n: (z: Zona) => indiceOportunidad(z, t),
    })),
  ];

  const opciones = (
    <>
      {ZONAS.map((z) => (
        <option key={z.id} value={z.id} disabled={zonaProtegida(z)}>
          {z.nombre}
          {zonaProtegida(z) ? " (datos protegidos)" : ""}
        </option>
      ))}
    </>
  );

  return (
    <section aria-labelledby="titulo-comparar" className="tarjeta p-6">
      <div className="flex items-center justify-between gap-4">
        <h3 id="titulo-comparar" className="text-2xl font-semibold">
          Comparar zonas
        </h3>
        <Button variant="ghost" size="icon" onClick={alCerrar} aria-label="Cerrar comparador">
          <X />
        </Button>
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <label htmlFor="cmp-a" className="eyebrow">
            Zona A
          </label>
          <Selector id="cmp-a" value={a} onChange={(e) => setA(e.target.value)}>
            {opciones}
          </Selector>
        </div>
        <div className="grid gap-1.5">
          <label htmlFor="cmp-b" className="eyebrow">
            Zona B
          </label>
          <Selector id="cmp-b" value={b} onChange={(e) => setB(e.target.value)}>
            {opciones}
          </Selector>
        </div>
      </div>
      {za && zb && (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse text-sm">
            <caption className="sr-only">
              Métricas de {za.nombre} y {zb.nombre} lado a lado
            </caption>
            <thead>
              <tr className="border-b">
                <th scope="col" className="py-3 pr-4 text-left font-medium text-muted-foreground">
                  Métrica
                </th>
                <th scope="col" className="px-4 py-3 text-left font-display text-base font-semibold">
                  {za.nombre}
                </th>
                <th scope="col" className="px-4 py-3 text-left font-display text-base font-semibold">
                  {zb.nombre}
                </th>
              </tr>
            </thead>
            <tbody>
              {filas.map((f) => {
                const na = f.n?.(za);
                const nb = f.n?.(zb);
                const ganaA = na !== undefined && nb !== undefined && na > nb;
                const ganaB = na !== undefined && nb !== undefined && nb > na;
                return (
                  <tr key={f.t} className="border-b last:border-0">
                    <th scope="row" className="py-2.5 pr-4 text-left font-normal text-muted-foreground">
                      {f.t}
                    </th>
                    <td className={cn("cifra px-4 py-2.5 first-letter:uppercase", ganaA && "font-semibold")}>
                      {f.v(za)} {ganaA && <span className="sr-only">(mayor)</span>}
                    </td>
                    <td className={cn("cifra px-4 py-2.5 first-letter:uppercase", ganaB && "font-semibold")}>
                      {f.v(zb)} {ganaB && <span className="sr-only">(mayor)</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="mt-3 text-xs text-muted-foreground">
            En negrita, el valor más alto de cada fila. {AVISO_TARJETA}.
          </p>
        </div>
      )}
    </section>
  );
}
