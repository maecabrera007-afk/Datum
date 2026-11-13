// =============================================================
//  Panel de detalle de una zona: 5 gráficas, tarjetas resumen y
//  botón para ver sus datasets. Datos ilustrativos de demostración.
// =============================================================
import { ArrowRight, Info, ShieldAlert, TrendingDown, TrendingUp } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, XAxis, YAxis } from "recharts";

import { Button } from "@/components/ui/button";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { mesLegible, numero, pesos } from "@/lib/datum/formato";
import {
  DIAS,
  DIAS_LARGOS,
  diaPico,
  etiquetaZona,
  franjaLegible,
  horaPico,
  MESES_ZONAS,
  MINIMO_NEGOCIOS_ZONA,
  NOMBRES_MIX,
  NOMBRES_RESTAURANTE,
  zonaProtegida,
  type Zona,
} from "@/lib/datum/zonas";

// Escala de la marca: el valor más alto va en lima con borde tinta
const LIMA = "var(--lima)";
const TINTA = "var(--tinta)";
const GRISES = ["var(--tinta)", "var(--gris-medio)", "var(--mapa-2)", "var(--gris-claro)"];

const CONFIG = { valor: { label: "Valor", color: TINTA } } satisfies ChartConfig;

/** Índice del valor más alto de una lista */
const indiceMayor = (valores: number[]) => valores.reduce((m, v, i, a) => (v > (a[m] ?? -Infinity) ? i : m), 0);

export function DetalleZona({
  zona,
  datasetsEnZona,
  onVerDatasets,
}: {
  zona: Zona;
  datasetsEnZona: number;
  onVerDatasets: () => void;
}) {
  const protegida = zonaProtegida(zona);

  return (
    <section aria-labelledby="titulo-detalle-zona" className="grid gap-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="eyebrow">{etiquetaZona(zona)} · Detalle de la zona</p>
          <h2 id="titulo-detalle-zona" className="mt-2 text-3xl font-semibold md:text-4xl">
            {zona.nombre}
          </h2>
        </div>
        <p className="inline-flex items-center gap-2 self-start rounded-full bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground md:self-auto">
          <Info className="size-3.5 text-accent" aria-hidden /> Datos ilustrativos de demostración
        </p>
      </header>

      {protegida ? (
        <div className="tarjeta flex items-start gap-4 p-6">
          <ShieldAlert className="mt-0.5 size-5 shrink-0" aria-hidden />
          <div>
            <p className="font-medium">Datos insuficientes para proteger la privacidad</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Esta zona tiene menos de {MINIMO_NEGOCIOS_ZONA} negocios aportando datos. Para que nadie pueda ser
              identificado, no mostramos sus gráficas ni sus cifras.
            </p>
          </div>
        </div>
      ) : (
        <>
          <TarjetasResumen zona={zona} />
          <div className="grid gap-4 lg:grid-cols-2">
            <AfluenciaPorDia zona={zona} />
            <HorasPico zona={zona} />
            <MixNegocios zona={zona} />
            <TiposRestaurante zona={zona} />
            <div className="lg:col-span-2">
              <EvolucionVentas zona={zona} />
            </div>
          </div>
        </>
      )}

      <div className="flex flex-col gap-3 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {datasetsEnZona === 1 ? "1 dataset" : `${datasetsEnZona} datasets`} en {zona.nombre}.
        </p>
        <Button onClick={onVerDatasets}>
          Ver datasets de esta zona <ArrowRight />
        </Button>
      </div>
    </section>
  );
}

// ---------------- 6. Tarjetas resumen ----------------
function TarjetasResumen({ zona }: { zona: Zona }) {
  const pico = horaPico(zona);
  const items = [
    { titulo: "Negocios registrados", valor: numero(zona.negocios_registrados), nota: "aportando datos" },
    { titulo: "Ticket promedio", valor: pesos(zona.ticket_promedio), nota: "por compra" },
    { titulo: "Categoría más vendida", valor: zona.categoria_mas_vendida, nota: "en ventas totales" },
    { titulo: "Hora de mayor afluencia", valor: `${pico.franja.replace("-", "–")} h`, nota: franjaLegible(pico.franja) },
  ];
  return (
    <ul className="grid grid-cols-2 gap-px overflow-hidden rounded-[var(--radius)] border bg-border lg:grid-cols-4">
      {items.map((c) => (
        <li key={c.titulo} className="bg-background p-5">
          <p className="eyebrow">{c.titulo}</p>
          <p className="cifra mt-2 text-2xl font-semibold first-letter:uppercase md:text-3xl">{c.valor}</p>
          <p className="mt-1 text-xs text-muted-foreground">{c.nota}</p>
        </li>
      ))}
    </ul>
  );
}

/** Marco común de cada gráfica, con un resumen en texto para lectores de pantalla */
function Grafica({ titulo, resumen, children, extra }: { titulo: string; resumen: string; children: React.ReactNode; extra?: React.ReactNode }) {
  return (
    <figure className="tarjeta p-5">
      <figcaption className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="font-display text-lg font-semibold">{titulo}</span>
        {extra}
      </figcaption>
      <p className="mt-1 text-xs text-muted-foreground">{resumen}</p>
      <div className="mt-4" aria-hidden>
        {children}
      </div>
    </figure>
  );
}

// ---------------- 1. Afluencia por día ----------------
function AfluenciaPorDia({ zona }: { zona: Zona }) {
  const datos = DIAS.map((d, i) => ({ nombre: d, valor: zona.afluencia_por_dia[i] ?? 0 }));
  const mayor = diaPico(zona);
  return (
    <Grafica
      titulo="Afluencia por día de la semana"
      resumen={`El día con más compradores es el ${DIAS_LARGOS[mayor]} (${datos[mayor]?.valor}/100).`}
    >
      <ChartContainer config={CONFIG} className="aspect-[16/9] w-full">
        <BarChart data={datos} margin={{ left: -16, right: 4 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="nombre" tickLine={false} axisLine={false} />
          <YAxis tickLine={false} axisLine={false} domain={[0, 100]} />
          <ChartTooltip content={<ChartTooltipContent formatter={(v) => `${v}/100`} hideIndicator />} />
          <Bar dataKey="valor" radius={[6, 6, 0, 0]} strokeWidth={1.5}>
            {datos.map((d, i) => (
              <Cell key={d.nombre} fill={i === mayor ? LIMA : TINTA} stroke={TINTA} />
            ))}
          </Bar>
        </BarChart>
      </ChartContainer>
    </Grafica>
  );
}

// ---------------- 2. Horas pico ----------------
function HorasPico({ zona }: { zona: Zona }) {
  const datos = zona.horas_pico.map((h) => ({ nombre: h.franja.replace("-", "–"), valor: h.valor }));
  const pico = horaPico(zona);
  return (
    <Grafica titulo="Horas pico de compra" resumen={`La franja más fuerte es de ${franjaLegible(pico.franja)} (${pico.valor}/100).`}>
      <ChartContainer config={CONFIG} className="aspect-[16/9] w-full">
        <LineChart data={datos} margin={{ left: -16, right: 20, top: 8 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="nombre" tickLine={false} axisLine={false} interval={0} fontSize={10} />
          <YAxis tickLine={false} axisLine={false} domain={[0, 100]} />
          <ChartTooltip content={<ChartTooltipContent formatter={(v) => `${v}/100`} hideIndicator />} />
          <Line
            dataKey="valor"
            type="monotone"
            stroke={TINTA}
            strokeWidth={2}
            dot={(p: { cx?: number; cy?: number; index?: number }) => (
              <circle
                key={p.index}
                cx={p.cx}
                cy={p.cy}
                r={p.index === indiceMayor(datos.map((d) => d.valor)) ? 6 : 3}
                fill={p.index === indiceMayor(datos.map((d) => d.valor)) ? LIMA : TINTA}
                stroke={TINTA}
                strokeWidth={1.5}
              />
            )}
          />
        </LineChart>
      </ChartContainer>
    </Grafica>
  );
}

// ---------------- 3. Mezcla de negocios (dona) ----------------
function MixNegocios({ zona }: { zona: Zona }) {
  const datos = (Object.keys(NOMBRES_MIX) as (keyof Zona["mix_negocios"])[])
    .map((k) => ({ nombre: NOMBRES_MIX[k], valor: zona.mix_negocios[k] }))
    .sort((a, b) => b.valor - a.valor);
  const color = (i: number) => (i === 0 ? LIMA : (GRISES[(i - 1) % GRISES.length] ?? TINTA));
  return (
    <Grafica titulo="Tipos de negocio predominantes" resumen={`Predominan ${datos[0]?.nombre.toLowerCase()} con ${datos[0]?.valor} %.`}>
      <div className="grid items-center gap-4 sm:grid-cols-[1fr_auto]">
        <ChartContainer config={CONFIG} className="mx-auto h-[200px] w-[200px]">
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent nameKey="nombre" formatter={(v, n) => `${n}: ${v} %`} hideIndicator />} />
            <Pie data={datos} dataKey="valor" nameKey="nombre" cx="50%" cy="50%" innerRadius="55%" outerRadius="92%" startAngle={90} endAngle={-270} stroke={TINTA} strokeWidth={1.5}>
              {datos.map((d, i) => (
                <Cell key={d.nombre} fill={color(i)} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
        <ul className="grid gap-2 text-sm">
          {datos.map((d, i) => (
            <li key={d.nombre} className="flex items-center gap-2">
              <span className="size-3 shrink-0 rounded-sm border border-foreground" style={{ background: color(i) }} />
              <span className="flex-1">{d.nombre}</span>
              <span className="cifra font-medium">{d.valor} %</span>
            </li>
          ))}
        </ul>
      </div>
    </Grafica>
  );
}

// ---------------- 4. Tipos de restaurante ----------------
function TiposRestaurante({ zona }: { zona: Zona }) {
  const datos = (Object.keys(NOMBRES_RESTAURANTE) as (keyof Zona["tipos_restaurante"])[])
    .map((k) => ({ nombre: NOMBRES_RESTAURANTE[k], valor: zona.tipos_restaurante[k] }))
    .sort((a, b) => b.valor - a.valor);
  return (
    <Grafica
      titulo="Restaurantes: tipos más frecuentes"
      resumen={`El más común es ${datos[0]?.nombre.toLowerCase()} (${datos[0]?.valor} %); el menos común, ${datos[datos.length - 1]?.nombre.toLowerCase()} (${datos[datos.length - 1]?.valor} %).`}
    >
      <ChartContainer config={CONFIG} className="aspect-[16/9] w-full">
        <BarChart data={datos} layout="vertical" margin={{ left: 8, right: 16 }}>
          <CartesianGrid horizontal={false} />
          <XAxis type="number" hide domain={[0, "dataMax"]} />
          <YAxis type="category" dataKey="nombre" tickLine={false} axisLine={false} width={112} fontSize={11} />
          <ChartTooltip content={<ChartTooltipContent formatter={(v) => `${v} %`} hideIndicator />} />
          <Bar dataKey="valor" radius={[0, 6, 6, 0]} strokeWidth={1.5}>
            {datos.map((d, i) => (
              <Cell key={d.nombre} fill={i === 0 ? LIMA : TINTA} stroke={TINTA} />
            ))}
          </Bar>
        </BarChart>
      </ChartContainer>
    </Grafica>
  );
}

// ---------------- 5. Evolución de ventas ----------------
function EvolucionVentas({ zona }: { zona: Zona }) {
  const datos = MESES_ZONAS.map((m, i) => ({ nombre: m, valor: zona.ventas_ultimos_6_meses[i] ?? 0 }));
  const crece = zona.crecimiento_trimestral >= 0;
  const Icono = crece ? TrendingUp : TrendingDown;
  return (
    <Grafica
      titulo="Ventas promedio por negocio, últimos 6 meses"
      resumen={`De ${pesos(datos[0]?.valor ?? 0)} en ${mesLegible(datos[0]?.nombre ?? "")} a ${pesos(datos[datos.length - 1]?.valor ?? 0)} en ${mesLegible(datos[datos.length - 1]?.nombre ?? "")}.`}
      extra={
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
          <Icono className="size-3.5 text-accent" aria-hidden />
          <span className="cifra">
            {crece ? "+" : ""}
            {numero(zona.crecimiento_trimestral, 1)} %
          </span>
          trimestral
        </span>
      }
    >
      <ChartContainer config={CONFIG} className="h-64 w-full">
        <LineChart data={datos} margin={{ left: 4, right: 24, top: 8 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="nombre" tickLine={false} axisLine={false} tickFormatter={(v: string) => mesLegible(v)} />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={72}
            fontSize={11}
            domain={["dataMin - 1000000", "dataMax + 1000000"]}
            tickFormatter={(v: number) => `$${numero(v / 1_000_000, 0)} M`}
          />
          <ChartTooltip content={<ChartTooltipContent labelFormatter={(v) => mesLegible(String(v))} formatter={(v) => pesos(Number(v))} hideIndicator />} />
          <Line dataKey="valor" type="monotone" stroke={TINTA} strokeWidth={2} dot={{ r: 3, fill: TINTA }} activeDot={{ r: 6, fill: LIMA, stroke: TINTA }} />
        </LineChart>
      </ChartContainer>
    </Grafica>
  );
}
