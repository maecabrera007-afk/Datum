// =============================================================
//  Catálogo con 3 pestañas: Datasets, Mapa de zonas y Oportunidades
// =============================================================
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Info, Search, SlidersHorizontal, X } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";

import { EncabezadoPagina, EstadoVacio, Pagina, Selector } from "@/components/datum/comunes";
import { TarjetaDataset } from "@/components/datum/dataset";
import { PestanaMapa } from "@/components/datum/mapa";
import { PestanaOportunidades } from "@/components/datum/oportunidades";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CLAVES, useAlmacen } from "@/lib/datum/almacen";
import {
  busquedaDesdeFiltros,
  catalogoVisible,
  FILTROS_INICIALES,
  filtrarCatalogo,
  filtrosDesdeBusqueda,
  validarBusqueda,
  type BusquedaCatalogo,
  type PestanaCatalogo,
  LIMITES_PRECIO,
  LIMITES_PUNTAJE,
  PERIODOS,
  type Filtros,
  type Orden,
} from "@/lib/datum/catalogo";
import { pesos } from "@/lib/datum/formato";
import { NOMBRES_SECTOR, type Dataset } from "@/lib/datum/tipos";
import {
  COMUNAS_ZONA,
  CORREGIMIENTOS,
  SECTOR_A_TIPO,
  TIPO_A_SECTOR,
  zonaPorNombre,
  type Capa,
  type TipoNegocio,
  type Zona,
} from "@/lib/datum/zonas";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/catalogo/")({
  validateSearch: (s: Record<string, unknown>): BusquedaCatalogo => validarBusqueda(s),
  head: () => ({
    meta: [
      { title: "Catálogo de datos de barrio — Datum" },
      {
        name: "description",
        content: "Datasets anónimos de ventas de tiendas, restaurantes, cafés y panaderías de Medellín, con mapa de zonas y oportunidades de negocio.",
      },
      { property: "og:title", content: "Catálogo de datos de barrio — Datum" },
      { property: "og:description", content: "Datasets, mapa de zonas y oportunidades por comuna. Datos ilustrativos de demostración." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Catalogo,
});

function Catalogo() {
  const busqueda = Route.useSearch();
  const navegar = useNavigate({ from: Route.fullPath });
  const misDatasets = useAlmacen<Dataset[]>(CLAVES.misDatasets, []);

  const filtros = filtrosDesdeBusqueda(busqueda);
  const pestana = busqueda.pestana ?? "datasets";
  const capa = busqueda.capa ?? "afluencia";
  const tipo = filtros.sector === "todos" ? null : SECTOR_A_TIPO[filtros.sector];

  /** Cambia los filtros sin perder la pestaña ni la capa */
  const setFiltros = (f: Filtros) =>
    navegar({
      search: (prev) => ({
        ...busquedaDesdeFiltros(f),
        ...(prev.pestana ? { pestana: prev.pestana } : {}),
        ...(prev.capa ? { capa: prev.capa } : {}),
      }),
      replace: true,
      resetScroll: false,
    });
  const setPestana = (p: PestanaCatalogo) => navegar({ search: (prev) => ({ ...prev, pestana: p }), replace: true, resetScroll: false });
  const setCapa = (c: Capa) => navegar({ search: (prev) => ({ ...prev, capa: c }), replace: true, resetScroll: false });

  // La zona elegida en el mapa es la misma del filtro de zona de Datasets
  const seleccionada = zonaPorNombre(filtros.comuna);
  const seleccionar = (z: Zona | null) => setFiltros({ ...filtros, comuna: z ? z.nombre : "todas" });
  const setTipo = (t: TipoNegocio | null) => setFiltros({ ...filtros, sector: t ? TIPO_A_SECTOR[t] : "todos" });
  const datasetsEnZona = seleccionada
    ? catalogoVisible(misDatasets ?? []).filter((d) => d.comuna === seleccionada.nombre).length
    : 0;

  /** "Ver datasets de esta zona": filtro aplicado y pestaña Datasets */
  const verDatasetsDeZona = (z: Zona) => {
    navegar({
      search: (prev) => ({ ...busquedaDesdeFiltros({ ...filtrosDesdeBusqueda(prev), comuna: z.nombre }), pestana: "datasets", ...(prev.capa ? { capa: prev.capa } : {}) }),
      resetScroll: false,
    });
    document.getElementById("pestanas-catalogo")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  /** "Ver en el mapa": selecciona la zona y abre la pestaña Mapa */
  const verEnMapa = (z: Zona) => {
    navegar({
      search: (prev) => ({ ...busquedaDesdeFiltros({ ...filtrosDesdeBusqueda(prev), comuna: z.nombre }), pestana: "mapa", ...(prev.capa ? { capa: prev.capa } : {}) }),
      resetScroll: false,
    });
    document.getElementById("pestanas-catalogo")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <Pagina>
      <EncabezadoPagina
        etiqueta="Catálogo"
        titulo="Datos de barrio que puedes confiar"
        descripcion="Ventas resumidas por mes y categoría, sin datos personales. Pagos simulados."
      />

      <Tabs id="pestanas-catalogo" value={pestana} onValueChange={(v) => setPestana(v as PestanaCatalogo)} className="mt-8 scroll-mt-24">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <TabsList aria-label="Secciones del catálogo">
            <TabsTrigger value="datasets">Datasets</TabsTrigger>
            <TabsTrigger value="mapa">Mapa de zonas</TabsTrigger>
            <TabsTrigger value="oportunidades">Oportunidades</TabsTrigger>
          </TabsList>
          <FiltrosCompartidos filtros={filtros} onQuitarZona={() => seleccionar(null)} onQuitarSector={() => setTipo(null)} />
        </div>

        <TabsContent value="datasets" className="mt-8">
          <PestanaDatasets filtros={filtros} setFiltros={setFiltros} />
        </TabsContent>
        <TabsContent value="mapa" className="mt-8">
          <PestanaMapa
            capa={capa}
            setCapa={setCapa}
            tipo={tipo}
            seleccionada={seleccionada}
            onSeleccionar={seleccionar}
            datasetsEnZona={datasetsEnZona}
            onVerDatasets={() => seleccionada && verDatasetsDeZona(seleccionada)}
          />
        </TabsContent>
        <TabsContent value="oportunidades" className="mt-8">
          <PestanaOportunidades
            tipo={tipo}
            setTipo={setTipo}
            seleccionada={seleccionada}
            onVerEnMapa={verEnMapa}
            onVerDatasets={verDatasetsDeZona}
          />
        </TabsContent>
      </Tabs>
    </Pagina>
  );
}

/** Chips con la zona y el sector activos: se ven en las 3 pestañas */
function FiltrosCompartidos({
  filtros,
  onQuitarZona,
  onQuitarSector,
}: {
  filtros: Filtros;
  onQuitarZona: () => void;
  onQuitarSector: () => void;
}) {
  const chips = [
    filtros.comuna !== "todas" && { texto: filtros.comuna, quitar: onQuitarZona, etiqueta: "zona" },
    filtros.sector !== "todos" && { texto: NOMBRES_SECTOR[filtros.sector], quitar: onQuitarSector, etiqueta: "sector" },
  ].filter(Boolean) as { texto: string; quitar: () => void; etiqueta: string }[];
  if (chips.length === 0) return null;
  return (
    <ul className="flex flex-wrap gap-2" aria-label="Zona y sector activos en todas las pestañas">
      {chips.map((c) => (
        <li key={c.etiqueta}>
          <button
            type="button"
            onClick={c.quitar}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-foreground bg-background px-3 py-1 text-xs font-medium hover:bg-secondary"
            aria-label={`Quitar ${c.etiqueta}: ${c.texto}`}
          >
            <span className="text-muted-foreground">{c.etiqueta === "zona" ? "Zona" : "Sector"}:</span> {c.texto} <X className="size-3.5" aria-hidden />
          </button>
        </li>
      ))}
    </ul>
  );
}

// ---------------- Pestaña 1: Datasets ----------------

/** Cuántos filtros se alejan del valor inicial (sin contar el orden) */
function contarActivos(f: Filtros): number {
  const i = FILTROS_INICIALES;
  return [
    f.texto.trim() !== "",
    f.sector !== i.sector,
    f.comuna !== i.comuna,
    f.periodo !== i.periodo,
    f.puntaje[0] !== i.puntaje[0] || f.puntaje[1] !== i.puntaje[1],
    f.precio[0] !== i.precio[0] || f.precio[1] !== i.precio[1],
  ].filter(Boolean).length;
}

function PestanaDatasets({ filtros, setFiltros }: { filtros: Filtros; setFiltros: (f: Filtros) => void }) {
  const misDatasets = useAlmacen<Dataset[]>(CLAVES.misDatasets, []);
  const [verFiltros, setVerFiltros] = useState(false);
  const cambiar = <K extends keyof Filtros>(clave: K, valor: Filtros[K]) => setFiltros({ ...filtros, [clave]: valor });

  const lista = useMemo(() => filtrarCatalogo(catalogoVisible(misDatasets ?? []), filtros), [misDatasets, filtros]);
  const activos = contarActivos(filtros);
  const limpiar = () => setFiltros({ ...FILTROS_INICIALES, orden: filtros.orden });

  return (
    <div className="grid gap-8 lg:grid-cols-[17rem_1fr]">
      {/* Filtros */}
      <div>
        <Button variant="outline" className="w-full lg:hidden" aria-expanded={verFiltros} onClick={() => setVerFiltros(!verFiltros)}>
          <SlidersHorizontal /> Filtros{activos > 0 ? ` (${activos})` : ""}
        </Button>
        <form
          aria-label="Filtros"
          onSubmit={(e) => e.preventDefault()}
          className={cn("mt-4 grid content-start gap-6 lg:mt-0 lg:grid", !verFiltros && "hidden")}
        >
          <Campo id="f-sector" etiqueta="Sector">
            <Selector id="f-sector" value={filtros.sector} onChange={(e) => cambiar("sector", e.target.value as Filtros["sector"])}>
              <option value="todos">Todos los sectores</option>
              {Object.entries(NOMBRES_SECTOR).map(([v, t]) => (
                <option key={v} value={v}>
                  {t}
                </option>
              ))}
            </Selector>
          </Campo>
          <Campo id="f-zona" etiqueta="Zona">
            <Selector id="f-zona" value={filtros.comuna} onChange={(e) => cambiar("comuna", e.target.value)}>
              <option value="todas">Todas las zonas</option>
              <optgroup label="Comunas">
                {COMUNAS_ZONA.map((z) => (
                  <option key={z.id} value={z.nombre}>
                    {z.codigo}. {z.nombre}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Corregimientos">
                {CORREGIMIENTOS.map((z) => (
                  <option key={z.id} value={z.nombre}>
                    {z.nombre}
                  </option>
                ))}
              </optgroup>
            </Selector>
          </Campo>
          <Campo id="f-periodo" etiqueta="Periodo">
            <Selector id="f-periodo" value={filtros.periodo} onChange={(e) => cambiar("periodo", e.target.value)}>
              <option value="todos">Cualquier periodo</option>
              {PERIODOS.map((p) => (
                <option key={p.valor} value={p.valor}>
                  {p.etiqueta}
                </option>
              ))}
            </Selector>
          </Campo>
          <Rango
            etiqueta="Puntaje de calidad"
            valor={filtros.puntaje}
            limites={LIMITES_PUNTAJE}
            paso={1}
            formato={(n) => String(n)}
            onChange={(v) => cambiar("puntaje", v)}
          />
          <Rango
            etiqueta="Precio"
            valor={filtros.precio}
            limites={LIMITES_PRECIO}
            paso={5000}
            formato={pesos}
            onChange={(v) => cambiar("precio", v)}
          />
          <Button type="button" variant="ghost" onClick={limpiar} disabled={activos === 0}>
            Quitar filtros
          </Button>
        </form>
      </div>

      {/* Resultados */}
      <div className="min-w-0">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <label htmlFor="f-texto" className="sr-only">
              Buscar datasets
            </label>
            <Input
              id="f-texto"
              type="search"
              value={filtros.texto}
              placeholder="Buscar por título, zona o categoría"
              className="h-10 rounded-full pl-10"
              onChange={(e) => cambiar("texto", e.target.value)}
            />
          </div>
          <label htmlFor="f-orden" className="sr-only">
            Ordenar por
          </label>
          <Selector id="f-orden" className="sm:w-56" value={filtros.orden} onChange={(e) => cambiar("orden", e.target.value as Orden)}>
            <option value="puntaje">Mejor puntaje</option>
            <option value="precio_asc">Precio: menor a mayor</option>
            <option value="precio_desc">Precio: mayor a menor</option>
            <option value="recientes">Más recientes</option>
          </Selector>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-2 text-sm">
          <p role="status" aria-live="polite" className="font-medium">
            {lista.length === 1 ? "1 dataset" : `${lista.length} datasets`}
          </p>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Info className="size-3.5" aria-hidden /> Datasets de ejemplo con datos ilustrativos de demostración
          </p>
        </div>

        {lista.length === 0 ? (
          <div className="mt-4">
            <EstadoVacio
              titulo="Nada por aquí con esos filtros"
              texto="Prueba con otra zona, amplía el rango de precio o borra la búsqueda."
              accion={
                <Button variant="outline" onClick={limpiar}>
                  Quitar filtros
                </Button>
              }
            />
          </div>
        ) : (
          <ul className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {lista.map((d) => (
              <li key={d.id}>
                <TarjetaDataset dataset={d} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Campo({ id, etiqueta, children }: { id: string; etiqueta: string; children: ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <label htmlFor={id} className="eyebrow">
        {etiqueta}
      </label>
      {children}
    </div>
  );
}

function Rango({
  etiqueta,
  valor,
  limites,
  paso,
  formato,
  onChange,
}: {
  etiqueta: string;
  valor: [number, number];
  limites: [number, number];
  paso: number;
  formato: (n: number) => string;
  onChange: (v: [number, number]) => void;
}) {
  return (
    <fieldset className="grid gap-2">
      <legend className="eyebrow mb-1.5">{etiqueta}</legend>
      <Slider
        min={limites[0]}
        max={limites[1]}
        step={paso}
        minStepsBetweenThumbs={1}
        value={valor}
        etiquetas={[`${etiqueta} mínimo`, `${etiqueta} máximo`]}
        onValueChange={(v) => onChange([v[0] ?? limites[0], v[1] ?? limites[1]])}
      />
      <p className="cifra flex justify-between text-sm">
        <span>{formato(valor[0])}</span>
        <span>{formato(valor[1])}</span>
      </p>
    </fieldset>
  );
}
