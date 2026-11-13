// =============================================================
//  Tablero del vendedor: puntaje, gráficas y publicación anónima
// =============================================================
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { toast } from "sonner";

import {
  Barra,
  Cargando,
  DesglosePuntaje,
  EncabezadoPagina,
  EstadoVacio,
  InsigniaEstado,
  Pagina,
  RequiereSesion,
} from "@/components/datum/comunes";
import { FormulaPrecio, TablaAgregada } from "@/components/datum/dataset";
import { Button } from "@/components/ui/button";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CLAVES, useAlmacen } from "@/lib/datum/almacen";
import { puedePublicar, UMBRAL_PUBLICACION } from "@/lib/datum/calidad";
import { catalogoVisible, guardarDatasetUsuario } from "@/lib/datum/catalogo";
import { promedioSector, resumenVentas, topProductos, ventasPorCategoria, ventasPorMes } from "@/lib/datum/dashboard";
import { fechaLegible, mesLegible, numero, pesos } from "@/lib/datum/formato";
import { idDatasetDe, prepararDataset } from "@/lib/datum/publicar";
import { NOMBRES_SECTOR, type Dataset, type EstadoDataset, type Trabajo, type Usuario } from "@/lib/datum/tipos";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Mi tablero de ventas — Datum" },
      { name: "description", content: "Tu puntaje de calidad, tus ventas por mes y categoría, y la opción de publicar una versión anónima." },
      { property: "og:title", content: "Mi tablero de ventas — Datum" },
      { property: "og:description", content: "Puntaje de calidad, gráficas de ventas y publicación anónima de tus datos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <RequiereSesion rol="vendedor">{(u) => <Tablero usuario={u} />}</RequiereSesion>,
});

const CONFIG_GRAFICA = { valor: { label: "Ventas", color: "var(--chart-1)" } } satisfies ChartConfig;

function Tablero({ usuario }: { usuario: Usuario }) {
  const trabajo = useAlmacen<Trabajo | null>(CLAVES.trabajo, null);
  const misDatasets = useAlmacen<Dataset[]>(CLAVES.misDatasets, []);

  if (trabajo === undefined || misDatasets === undefined) return <Cargando />;
  if (!trabajo)
    return (
      <Pagina>
        <EstadoVacio
          titulo="Aún no has subido tus ventas"
          texto="Sube un CSV y en un minuto verás aquí tu puntaje de calidad y tus gráficas."
          accion={
            <Button asChild>
              <Link to="/subir">Subir mis ventas</Link>
            </Button>
          }
        />
      </Pagina>
    );

  return <Contenido usuario={usuario} trabajo={trabajo} misDatasets={misDatasets} />;
}

function Contenido({ usuario, trabajo, misDatasets }: { usuario: Usuario; trabajo: Trabajo; misDatasets: Dataset[] }) {
  const filas = trabajo.filasLimpias;
  const resumen = useMemo(() => resumenVentas(filas), [filas]);
  const porMes = useMemo(() => ventasPorMes(filas), [filas]);
  const porCategoria = useMemo(() => ventasPorCategoria(filas).slice(0, 8), [filas]);
  const top = useMemo(() => topProductos(filas), [filas]);
  const sector = usuario.sector ? promedioSector(catalogoVisible(misDatasets), usuario.sector) : null;
  const maxTop = top[0]?.valor ?? 1;

  const comparar = (propio: number, promedio: number | undefined) => {
    if (!promedio) return null;
    const dif = Math.round(((propio - promedio) / promedio) * 100);
    return `${dif >= 0 ? "+" : ""}${dif} % vs. promedio del sector (${pesos(promedio)})`;
  };

  const indicadores = [
    { titulo: "Total vendido", valor: pesos(resumen.total), nota: `${trabajo.nombreArchivo} · ${fechaLegible(trabajo.fecha)}` },
    { titulo: "Ventas registradas", valor: numero(resumen.transacciones), nota: `${numero(filas.length)} filas limpias` },
    { titulo: "Ticket promedio", valor: pesos(resumen.promedio), nota: comparar(resumen.promedio, sector?.ticketPromedio) },
    { titulo: "Ventas por mes", valor: pesos(resumen.ventasMensuales), nota: comparar(resumen.ventasMensuales, sector?.ventasMensuales) },
  ];

  return (
    <Pagina>
      <EncabezadoPagina
        etiqueta={usuario.negocio ? `${usuario.negocio} · ${usuario.comuna ?? ""}` : "Mi tablero"}
        titulo="Así van tus ventas"
        descripcion="Todo calculado con tus datos limpios. Nada de esto se publica sin tu permiso."
      >
        <Button asChild variant="outline">
          <Link to="/subir">Subir otro archivo</Link>
        </Button>
      </EncabezadoPagina>

      <section className="mt-12">
        <DesglosePuntaje calidad={trabajo.calidad} />
      </section>

      <section className="mt-16">
        <ul className="grid grid-cols-1 gap-px overflow-hidden rounded-[var(--radius)] border bg-border sm:grid-cols-2 lg:grid-cols-4">
          {indicadores.map((c) => (
            <li key={c.titulo} className="bg-background p-6">
              <p className="eyebrow">{c.titulo}</p>
              <p className="cifra mt-3 text-3xl font-semibold">{c.valor}</p>
              {c.nota && <p className="mt-2 text-xs text-muted-foreground">{c.nota}</p>}
            </li>
          ))}
        </ul>
        {usuario.sector && sector && (
          <p className="mt-3 text-xs text-muted-foreground">
            Promedio del sector «{NOMBRES_SECTOR[usuario.sector]}» calculado con {sector.datasets} dataset(s) del catálogo.
          </p>
        )}
      </section>

      <section className="mt-16 grid gap-6 lg:grid-cols-2">
        <div className="tarjeta p-6">
          <h2 className="text-xl font-semibold">Ventas por mes</h2>
          {porMes.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">No hay fechas válidas para graficar.</p>
          ) : (
            <ChartContainer config={CONFIG_GRAFICA} className="mt-6 aspect-[4/3] w-full">
              <BarChart data={porMes} margin={{ left: 8, right: 8 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="nombre" tickLine={false} axisLine={false} tickFormatter={(v: string) => mesLegible(v)} />
                <YAxis tickLine={false} axisLine={false} width={56} tickFormatter={(v: number) => `${numero(v / 1000)} mil`} />
                <ChartTooltip
                  content={<ChartTooltipContent labelFormatter={(v) => mesLegible(String(v))} formatter={(v) => pesos(Number(v))} />}
                />
                <Bar dataKey="valor" fill="var(--color-valor)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ChartContainer>
          )}
        </div>
        <div className="tarjeta p-6">
          <h2 className="text-xl font-semibold">Ventas por categoría</h2>
          {porCategoria.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">No hay categorías para graficar.</p>
          ) : (
            <ChartContainer config={CONFIG_GRAFICA} className="mt-6 aspect-[4/3] w-full">
              <BarChart data={porCategoria} layout="vertical" margin={{ left: 8, right: 8 }}>
                <CartesianGrid horizontal={false} />
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="nombre" tickLine={false} axisLine={false} width={96} />
                <ChartTooltip content={<ChartTooltipContent formatter={(v) => pesos(Number(v))} />} />
                <Bar dataKey="valor" fill="var(--color-valor)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ChartContainer>
          )}
        </div>
      </section>

      <section className="mt-6 tarjeta p-6">
        <h2 className="text-xl font-semibold">Tus 5 productos más vendidos</h2>
        <ol className="mt-6 grid gap-4">
          {top.map((p, i) => (
            <li key={p.nombre} className="grid gap-1.5">
              <div className="flex justify-between gap-4 text-sm">
                <span>
                  <span className="cifra mr-2 text-muted-foreground">{i + 1}</span>
                  {p.nombre}
                </span>
                <span className="cifra font-medium">{pesos(p.valor)}</span>
              </div>
              <Barra valor={(p.valor / maxTop) * 100} />
            </li>
          ))}
        </ol>
      </section>

      <SeccionPublicar usuario={usuario} trabajo={trabajo} misDatasets={misDatasets} />
    </Pagina>
  );
}

function SeccionPublicar({ usuario, trabajo, misDatasets }: { usuario: Usuario; trabajo: Trabajo; misDatasets: Dataset[] }) {
  const existente = misDatasets.find((d) => d.id === idDatasetDe(trabajo, usuario));
  const [titulo, setTitulo] = useState(existente?.titulo ?? "");
  const [descripcion, setDescripcion] = useState(existente?.descripcion ?? "");
  const catalogo = useMemo(() => catalogoVisible(misDatasets), [misDatasets]);
  const vista = useMemo(
    () => prepararDataset(trabajo, usuario, catalogo, { titulo, descripcion, estado: "borrador" }),
    [trabajo, usuario, catalogo, titulo, descripcion],
  );

  const guardarComo = (estado: EstadoDataset) => {
    const r = prepararDataset(trabajo, usuario, catalogo, { titulo, descripcion, estado });
    if (!r.ok) return void toast.error(r.error);
    if (!guardarDatasetUsuario(r.borrador.dataset))
      return void toast.error("No hay espacio en este navegador para guardar el dataset.");
    toast.success(estado === "publicado" ? "¡Tu dataset ya está en el catálogo!" : "Guardado como borrador.");
  };

  return (
    <section className="mt-16 border-t pt-16" aria-labelledby="titulo-publicar">
      <p className="eyebrow mb-3">Opcional</p>
      <h2 id="titulo-publicar" className="text-3xl font-semibold md:text-4xl">
        Publica una versión anónima y gana dinero
      </h2>

      {!puedePublicar(trabajo.calidad.total) ? (
        <div className="mt-8">
          <EstadoVacio
            titulo={`Necesitas ${UMBRAL_PUBLICACION} puntos para publicar`}
            texto={`Tu puntaje es ${trabajo.calidad.total}. Revisa que las columnas estén bien asignadas y que el archivo tenga fechas, cantidades y precios.`}
            accion={
              <Button asChild variant="outline">
                <Link to="/subir">Revisar mi archivo</Link>
              </Button>
            }
          />
        </div>
      ) : !vista.ok ? (
        <p role="alert" className="mt-8 text-sm text-destructive">
          {vista.error}
        </p>
      ) : (
        <div className="mt-10 grid gap-10 lg:grid-cols-[1.5fr_1fr]">
          <div className="grid content-start gap-8">
            <ul className="grid gap-3 text-sm">
              {[
                "Solo se publican totales por mes y categoría: nunca productos ni ventas una por una.",
                trabajo.columnasPersonales.length
                  ? `Las columnas con datos personales (${trabajo.columnasPersonales.join(", ")}) se quitaron.`
                  : "No encontramos columnas con datos personales.",
                `${vista.borrador.agregacion.gruposCombinados} grupo(s) pequeños se unieron en «otras categorías» y ${vista.borrador.agregacion.gruposSuprimidos} se eliminaron para que nadie sea identificable.`,
              ].map((t) => (
                <li key={t} className="flex gap-3">
                  <ShieldCheck className="mt-0.5 size-4 shrink-0" /> {t}
                </li>
              ))}
            </ul>
            <div>
              <div className="mb-3 flex items-baseline justify-between gap-4">
                <h3 className="text-xl font-semibold">Lo que verán los compradores</h3>
                <p className="text-sm text-muted-foreground">{numero(vista.borrador.dataset.filas.length)} filas</p>
              </div>
              <TablaAgregada titulo="Vista previa del dataset anónimo" filas={vista.borrador.dataset.filas.slice(0, 6)} />
            </div>
            <div className="grid gap-5">
              <div className="grid gap-2">
                <Label htmlFor="titulo">Título del dataset</Label>
                <Input id="titulo" value={titulo} placeholder={vista.borrador.dataset.titulo} onChange={(e) => setTitulo(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="descripcion">Descripción</Label>
                <Textarea
                  id="descripcion"
                  value={descripcion}
                  rows={3}
                  placeholder="¿Qué vende tu negocio? ¿A quién le pueden servir estos datos?"
                  onChange={(e) => setDescripcion(e.target.value)}
                />
              </div>
            </div>
          </div>

          <aside className="grid content-start gap-4">
            <FormulaPrecio factores={vista.borrador.dataset.factores} precio={vista.borrador.dataset.precio} />
            {existente?.estado && (
              <div className="flex items-center gap-2 text-sm">
                Estado actual: <InsigniaEstado estado={existente.estado} />
              </div>
            )}
            <Button size="lg" variant="acento" onClick={() => guardarComo("publicado")}>
              {existente?.estado === "publicado" ? "Actualizar en el catálogo" : "Publicar en el catálogo"} <ArrowRight />
            </Button>
            <Button variant="outline" onClick={() => guardarComo("borrador")}>
              Guardar como borrador
            </Button>
            {existente && (
              <Button asChild variant="link">
                <Link to="/panel">Ver en mi panel</Link>
              </Button>
            )}
          </aside>
        </div>
      )}
    </section>
  );
}
