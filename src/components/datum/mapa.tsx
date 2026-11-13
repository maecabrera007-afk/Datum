// =============================================================
//  Mapa esquemático de zonas de Medellín (SVG, sin servicios externos)
//  No es geográficamente exacto: cada zona es un hexágono con su nombre.
// =============================================================
import { ArrowDown, Info, X } from "lucide-react";
import { useRef, useState, type KeyboardEvent } from "react";

import { EstadoVacio } from "@/components/datum/comunes";
import { DetalleZona } from "@/components/datum/zona-detalle";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import { numero, pesos } from "@/lib/datum/formato";
import {
  AVISO_ZONAS,
  CAPAS,
  etiquetaZona,
  mejorOportunidad,
  MINIMO_NEGOCIOS_ZONA,
  NIVELES,
  nivelDe,
  rangoCapa,
  TIPOS_NEGOCIO,
  valorCapa,
  ZONAS,
  zonaProtegida,
  type Capa,
  type TipoNegocio,
  type Zona,
} from "@/lib/datum/zonas";
import { cn } from "@/lib/utils";

// ---------------- Geometría ----------------

/** Posición de cada zona en una cuadrícula de hexágonos (columna, fila) */
const POSICIONES: Record<string, [number, number]> = {
  "Doce de Octubre": [2, 0],
  Castilla: [3, 0],
  "Santa Cruz": [5, 0],
  Popular: [6, 0],
  Palmitas: [0, 1],
  Robledo: [2, 1],
  Aranjuez: [4, 1],
  Manrique: [5, 1],
  "San Cristóbal": [0, 2],
  "San Javier": [1, 2],
  "La América": [2, 2],
  "Laureles-Estadio": [3, 2],
  "La Candelaria": [5, 2],
  "Villa Hermosa": [6, 2],
  "Santa Elena": [7, 2],
  Altavista: [1, 3],
  Belén: [2, 3],
  Guayabal: [3, 3],
  "Buenos Aires": [5, 3],
  "San Antonio de Prado": [1, 4],
  "El Poblado": [5, 4],
};

const R = 50; // radio del hexágono dibujado
const PASO_X = 90; // distancia horizontal entre centros
const PASO_Y = 78; // distancia vertical entre filas
const ANCHO = 760;
const ALTO = 450;

/** Centro (x, y) de una celda; las filas impares se corren media celda */
function centro(col: number, fila: number): [number, number] {
  return [60 + col * PASO_X + (fila % 2 ? PASO_X / 2 : 0), 64 + fila * PASO_Y];
}

/** Puntos de un hexágono con la punta hacia arriba */
function hexagono(cx: number, cy: number, r: number): string {
  return Array.from({ length: 6 }, (_, i) => {
    const a = ((60 * i - 90) * Math.PI) / 180;
    return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
  }).join(" ");
}

/** Parte un nombre largo en líneas cortas para que quepa en el hexágono */
function partirNombre(nombre: string, max = 10): string[] {
  const lineas: string[] = [];
  for (const palabra of nombre.replace("-", "- ").split(" ")) {
    const ultima = lineas[lineas.length - 1];
    if (ultima !== undefined && (ultima + " " + palabra).length <= max) lineas[lineas.length - 1] = `${ultima} ${palabra}`;
    else lineas.push(palabra);
  }
  return lineas.map((l) => l.replace("- ", "-"));
}

// Río Medellín: pasa por los espacios vacíos entre hexágonos
const RIO = [centro(4, -0.4), centro(4, 0), centro(3, 1), centro(4, 2), centro(4, 3), centro(4, 4), centro(4, 4.6)]
  .map(([x, y]) => `${x},${y}`)
  .join(" ");

// ---------------- Formatos ----------------

/** Valor de la capa con su unidad, para el tooltip */
export function formatoCapa(capa: Capa, valor: number): string {
  if (capa === "ventas") return `${pesos(valor)} al mes`;
  if (capa === "negocios") return `${numero(valor)} negocios`;
  return `${valor}/100`;
}

/** Valor corto que va dentro del hexágono (para no depender del color) */
function valorCorto(capa: Capa, valor: number): string {
  if (capa === "ventas") return `$${numero(valor / 1_000_000, 1)} M`;
  return numero(valor);
}

const RELLENO = ["fill-mapa-1", "fill-mapa-2", "fill-mapa-3", "fill-mapa-4", "fill-mapa-5"];
const TEXTO = ["fill-foreground", "fill-foreground", "fill-primary-foreground", "fill-primary-foreground", "fill-foreground"];
const FONDO = ["bg-mapa-1", "bg-mapa-2", "bg-mapa-3", "bg-mapa-4", "bg-mapa-5"];

/** Nombre de la capa; en "oportunidad" incluye el tipo de negocio elegido */
export function nombreDeCapa(capa: Capa, tipo: TipoNegocio | null): string {
  const base = CAPAS.find((c) => c.id === capa)?.nombre ?? "";
  return capa === "oportunidad" && tipo ? `${base} · ${TIPOS_NEGOCIO[tipo]}` : base;
}

// ---------------- Mapa ----------------

export function MapaZonas({
  capa,
  tipo,
  seleccionada,
  onSeleccionar,
}: {
  capa: Capa;
  tipo: TipoNegocio | null;
  seleccionada: Zona | null;
  onSeleccionar: (z: Zona) => void;
}) {
  const [encima, setEncima] = useState<Zona | null>(null);
  const rango = rangoCapa(capa, ZONAS, tipo);
  const nombreCapa = nombreDeCapa(capa, tipo);

  const alTeclear = (e: KeyboardEvent, z: Zona) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSeleccionar(z);
    }
  };

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${ANCHO} ${ALTO}`}
        className="h-auto w-full min-w-[520px]"
        role="group"
        aria-label={`Mapa esquemático de Medellín. Capa: ${nombreCapa}`}
      >
        <defs>
          <pattern id="rayas-privacidad" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="8" height="8" className="fill-mapa-protegida" />
            <line x1="0" y1="0" x2="0" y2="8" className="stroke-muted-foreground" strokeWidth="2" opacity="0.35" />
          </pattern>
        </defs>

        <polyline points={RIO} className="fill-none stroke-muted-foreground" strokeWidth="3" strokeDasharray="2 7" strokeLinecap="round" opacity="0.6" />
        <text x={centro(4, 0)[0] + 4} y={centro(4, 0)[1] - 18} className="fill-muted-foreground font-display" fontSize="10" letterSpacing="1.5">
          RÍO
        </text>

        {ZONAS.map((z) => {
          const pos = POSICIONES[z.nombre];
          if (!pos) return null;
          const [cx, cy] = centro(pos[0], pos[1]);
          const protegida = zonaProtegida(z);
          const valor = valorCapa(z, capa, ZONAS, tipo);
          const nivel = nivelDe(valor, rango) - 1;
          const elegida = seleccionada?.id === z.id;
          const lineas = partirNombre(z.nombre);
          const claseTexto = protegida ? "fill-muted-foreground" : TEXTO[nivel];
          const inicioY = cy - ((lineas.length + 1) * 12) / 2 + 4;
          const descripcion = protegida
            ? "Datos insuficientes para proteger la privacidad"
            : `${nombreCapa}: ${formatoCapa(capa, valor)}`;

          return (
            <g
              key={z.id}
              role="button"
              tabIndex={0}
              aria-pressed={elegida}
              aria-label={`${etiquetaZona(z)} ${z.nombre}. ${descripcion}`}
              className="group cursor-pointer outline-none"
              onClick={() => onSeleccionar(z)}
              onKeyDown={(e) => alTeclear(e, z)}
              onMouseEnter={() => setEncima(z)}
              onMouseLeave={() => setEncima(null)}
              onFocus={() => setEncima(z)}
              onBlur={() => setEncima(null)}
            >
              <polygon
                points={hexagono(cx, cy, R + 5)}
                strokeWidth="3"
                className={cn(
                  "fill-none",
                  elegida ? "stroke-foreground" : "stroke-transparent group-focus-visible:stroke-foreground",
                  !elegida && "[stroke-dasharray:6_4]",
                )}
              />
              <polygon
                points={hexagono(cx, cy, R)}
                className={cn(
                  "transition-[fill] duration-300 group-hover:opacity-85",
                  protegida ? "stroke-border" : "stroke-background",
                  !protegida && RELLENO[nivel],
                )}
                fill={protegida ? "url(#rayas-privacidad)" : undefined}
                strokeWidth="1.5"
              />
              <text textAnchor="middle" className={cn("pointer-events-none select-none", claseTexto)} fontSize="10.5">
                <tspan x={cx} y={inicioY} className="font-display" fontSize="9" opacity="0.75">
                  {z.tipo === "comuna" ? z.codigo : "CORR."}
                </tspan>
                {lineas.map((l, i) => (
                  <tspan key={l} x={cx} y={inicioY + 12 * (i + 1)} fontWeight="500">
                    {l}
                  </tspan>
                ))}
                <tspan x={cx} y={inicioY + 12 * (lineas.length + 1) + 3} className="font-display" fontWeight="600" fontSize="12">
                  {protegida ? "—" : valorCorto(capa, valor)}
                </tspan>
              </text>
            </g>
          );
        })}
      </svg>

      {encima && <Tooltip zona={encima} capa={capa} tipo={tipo} />}
    </div>
  );
}

/** Cuadro flotante con nombre y valor de la capa activa */
function Tooltip({ zona, capa, tipo }: { zona: Zona; capa: Capa; tipo: TipoNegocio | null }) {
  const pos = POSICIONES[zona.nombre];
  if (!pos) return null;
  const [cx, cy] = centro(pos[0], pos[1]);
  const protegida = zonaProtegida(zona);
  const nombreCapa = nombreDeCapa(capa, tipo);
  const mejor = mejorOportunidad(zona);
  return (
    <div
      role="tooltip"
      className="pointer-events-none absolute z-10 w-56 -translate-x-1/2 -translate-y-full rounded-[var(--radius)] bg-primary p-3 text-sm text-primary-foreground"
      style={{ left: `${(cx / ANCHO) * 100}%`, top: `${((cy - R - 8) / ALTO) * 100}%` }}
    >
      <p className="eyebrow text-primary-foreground/60">{etiquetaZona(zona)}</p>
      <p className="font-display text-base font-semibold">{zona.nombre}</p>
      {protegida ? (
        <p className="mt-1 opacity-80">Datos insuficientes para proteger la privacidad</p>
      ) : (
        <p className="mt-1">
          <span className="opacity-70">{nombreCapa}: </span>
          <span className="cifra font-semibold text-accent">{formatoCapa(capa, valorCapa(zona, capa, ZONAS, tipo))}</span>
          {capa === "oportunidad" && !tipo && <span className="block text-xs opacity-70">Mejor opción: {TIPOS_NEGOCIO[mejor.tipo]}</span>}
        </p>
      )}
    </div>
  );
}

// ---------------- Leyenda ----------------

export function LeyendaMapa({ capa, tipo }: { capa: Capa; tipo: TipoNegocio | null }) {
  const [min, max] = rangoCapa(capa, ZONAS, tipo);
  const tramo = (max - min) / NIVELES;
  return (
    <div>
      <p className="eyebrow">Leyenda</p>
      <ul className="mt-3 grid gap-2 text-sm">
        {Array.from({ length: NIVELES }, (_, i) => NIVELES - 1 - i).map((i) => (
          <li key={i} className="flex items-center gap-3">
            <span className={cn("size-4 shrink-0 rounded-sm border", FONDO[i])} aria-hidden />
            <span className="cifra">
              {i === NIVELES - 1 ? "Más alto · " : i === 0 ? "Más bajo · " : ""}
              {valorCorto(capa, Math.round(min + tramo * i))} – {valorCorto(capa, Math.round(min + tramo * (i + 1)))}
            </span>
          </li>
        ))}
        <li className="flex items-center gap-3">
          <svg className="size-4 shrink-0 rounded-sm border" aria-hidden>
            <rect width="16" height="16" fill="url(#rayas-privacidad)" />
          </svg>
          <span>Menos de {MINIMO_NEGOCIOS_ZONA} negocios: datos ocultos</span>
        </li>
      </ul>
    </div>
  );
}

// ---------------- Pestaña completa ----------------

export function PestanaMapa({
  capa,
  setCapa,
  tipo,
  seleccionada,
  onSeleccionar,
  datasetsEnZona,
  onVerDatasets,
}: {
  capa: Capa;
  setCapa: (c: Capa) => void;
  /** Tipo de negocio elegido en el filtro de sector (o null = todos) */
  tipo: TipoNegocio | null;
  seleccionada: Zona | null;
  onSeleccionar: (z: Zona | null) => void;
  datasetsEnZona: number;
  onVerDatasets: () => void;
}) {
  const celular = useIsMobile();
  const [hojaAbierta, setHojaAbierta] = useState(false);
  const refDetalle = useRef<HTMLDivElement>(null);

  if (ZONAS.length === 0)
    return (
      <EstadoVacio
        titulo="No pudimos cargar el mapa"
        texto="Los datos de las zonas no están disponibles en este momento. Recarga la página para intentarlo de nuevo."
      />
    );

  /** Clic en una zona: la selecciona (o la quita) y en celular abre el panel inferior */
  const alElegir = (z: Zona) => {
    const quitar = seleccionada?.id === z.id;
    onSeleccionar(quitar ? null : z);
    if (celular && !quitar) setHojaAbierta(true);
  };

  const verDetalle = () => {
    if (celular) setHojaAbierta(true);
    else refDetalle.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const irADatasets = () => {
    setHojaAbierta(false);
    onVerDatasets();
  };

  return (
    <div className="grid gap-10">
      <div className="grid gap-8 lg:grid-cols-[1fr_18rem]">
        <div className="min-w-0">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground">
            <Info className="size-3.5 text-accent" aria-hidden /> {AVISO_ZONAS.replace(" No son datos reales.", "")}
          </p>
          <div className="tarjeta overflow-x-auto p-3 md:p-5">
            <MapaZonas capa={capa} tipo={tipo} seleccionada={seleccionada} onSeleccionar={alElegir} />
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Mapa esquemático, no geográficamente exacto. Usa Tab para recorrer las zonas y Enter para elegir una.
          </p>
        </div>

        <aside className="grid content-start gap-8">
          <fieldset>
            <legend className="eyebrow mb-3">Capa</legend>
            <div className="grid gap-2" role="radiogroup">
              {CAPAS.map((c) => (
                <label
                  key={c.id}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-full border px-4 py-2 text-sm transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring",
                    capa === c.id ? "border-foreground bg-primary text-primary-foreground" : "hover:border-foreground",
                  )}
                >
                  <input type="radio" name="capa" value={c.id} checked={capa === c.id} onChange={() => setCapa(c.id)} className="sr-only" />
                  {c.id === "oportunidad" ? nombreDeCapa(c.id, tipo) : c.nombre}
                </label>
              ))}
            </div>
            {capa === "oportunidad" && (
              <p className="mt-3 text-xs text-muted-foreground">
                {tipo
                  ? "Calculado para el sector elegido en los filtros."
                  : "Sin sector elegido: cada zona muestra su mejor tipo de negocio."}
              </p>
            )}
          </fieldset>

          <LeyendaMapa capa={capa} tipo={tipo} />

          <div className="tarjeta p-5" aria-live="polite">
            <p className="eyebrow">Zona seleccionada</p>
            {seleccionada ? (
              <>
                <p className="mt-2 font-display text-xl font-semibold">{seleccionada.nombre}</p>
                <p className="text-sm text-muted-foreground">{etiquetaZona(seleccionada)}</p>
                {zonaProtegida(seleccionada) ? (
                  <p className="mt-3 text-sm">Datos insuficientes para proteger la privacidad.</p>
                ) : (
                  <p className="mt-3 text-sm">
                    Filtro de zona aplicado en Datasets:{" "}
                    <strong>{datasetsEnZona === 1 ? "1 dataset" : `${datasetsEnZona} datasets`}</strong>.
                  </p>
                )}
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button size="sm" onClick={verDetalle}>
                    <ArrowDown /> Ver detalle
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => onSeleccionar(null)}>
                    <X /> Limpiar selección
                  </Button>
                </div>
              </>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">Haz clic en una zona para ver su detalle.</p>
            )}
          </div>
        </aside>
      </div>

      {/* Escritorio: el detalle aparece debajo del mapa */}
      {seleccionada && !celular && (
        <div ref={refDetalle} className="scroll-mt-24 border-t pt-10">
          <DetalleZona zona={seleccionada} datasetsEnZona={datasetsEnZona} onVerDatasets={irADatasets} />
        </div>
      )}

      {/* Celular: panel inferior deslizable */}
      {celular && (
        <Drawer open={hojaAbierta && !!seleccionada} onOpenChange={setHojaAbierta} shouldScaleBackground={false}>
          <DrawerContent className="max-h-[88vh]">
            <DrawerTitle className="sr-only">Detalle de {seleccionada?.nombre ?? "la zona"}</DrawerTitle>
            <DrawerDescription className="sr-only">Gráficas y cifras de la zona seleccionada. Desliza hacia abajo para cerrar.</DrawerDescription>
            <div className="overflow-y-auto px-5 pb-8 pt-4">
              {seleccionada && <DetalleZona zona={seleccionada} datasetsEnZona={datasetsEnZona} onVerDatasets={irADatasets} />}
            </div>
          </DrawerContent>
        </Drawer>
      )}
    </div>
  );
}
