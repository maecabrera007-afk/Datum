// =============================================================
//  catalogo.ts — Catálogo de datasets, filtros y datasets del vendedor
// =============================================================
import datasetsEjemplo from "@/data/datasets.json";
import { CLAVES, guardar, leer } from "./almacen";
import { NOMBRES_SECTOR, type Dataset, type EstadoDataset, type Sector } from "./tipos";
import { buscarZona, CAPAS, zonaPorNombre, type Capa } from "./zonas";

/** Los 16 datasets ficticios de ejemplo */
export const EJEMPLOS = datasetsEjemplo as Dataset[];

/** Comunas de Medellín que usamos en la plataforma */
export const COMUNAS = [
  "Popular", "Santa Cruz", "Manrique", "Aranjuez", "Castilla", "Doce de Octubre", "Robledo",
  "Villa Hermosa", "Buenos Aires", "La Candelaria", "Laureles-Estadio", "La América",
  "San Javier", "El Poblado", "Guayabal", "Belén",
];

/** Catálogo visible: ejemplos + datasets de usuarios que estén publicados. */
export function catalogoVisible(misDatasets: Dataset[]): Dataset[] {
  return [...EJEMPLOS, ...misDatasets.filter((d) => d.estado === "publicado")];
}

/** Busca un dataset por id (ejemplos y de usuarios, en cualquier estado). */
export function buscarDataset(id: string, misDatasets: Dataset[]): Dataset | undefined {
  return [...EJEMPLOS, ...misDatasets].find((d) => d.id === id);
}

// ---------------- Filtros ----------------

/** Periodos para filtrar: datasets con datos en los últimos N meses */
export const PERIODOS = [
  { valor: "3", etiqueta: "Últimos 3 meses", meses: 3 },
  { valor: "6", etiqueta: "Últimos 6 meses", meses: 6 },
  { valor: "12", etiqueta: "Últimos 12 meses", meses: 12 },
];

export type Orden = "puntaje" | "precio_asc" | "precio_desc" | "recientes";

/** Límites de los controles deslizantes */
export const LIMITES_PUNTAJE: [number, number] = [70, 100];
export const LIMITES_PRECIO: [number, number] = [0, 150000];

/** Puntaje mínimo para la insignia "Verificado" */
export const UMBRAL_VERIFICADO = 85;
export const esVerificado = (d: Dataset) => d.calidad.total >= UMBRAL_VERIFICADO;

export interface Filtros {
  texto: string;
  sector: Sector | "todos";
  comuna: string; // "todas" o el nombre de la zona
  periodo: string; // "todos" o "3" | "6" | "12"
  puntaje: [number, number];
  precio: [number, number];
  orden: Orden;
}

export const FILTROS_INICIALES: Filtros = {
  texto: "",
  sector: "todos",
  comuna: "todas",
  periodo: "todos",
  puntaje: LIMITES_PUNTAJE,
  precio: LIMITES_PRECIO,
  orden: "puntaje",
};

/** "AAAA-MM" de hace N meses contando desde el mes de `hoy` */
export function mesHace(hoy: Date, meses: number): string {
  const fecha = new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth() - meses, 1));
  return `${fecha.getUTCFullYear()}-${String(fecha.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** Quita tildes y pasa a minúsculas para buscar sin importar cómo se escriba */
const normalizar = (t: string) =>
  t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

/** ¿El texto buscado aparece en el título, descripción, zona, sector o categorías? */
function coincideTexto(d: Dataset, texto: string): boolean {
  const buscado = normalizar(texto);
  if (!buscado) return true;
  const campos = [d.titulo, d.descripcion, d.comuna, NOMBRES_SECTOR[d.sector], ...d.filas.map((f) => f.categoria)];
  return campos.some((c) => normalizar(c).includes(buscado));
}

/** Aplica todos los filtros combinados y el orden al catálogo. */
export function filtrarCatalogo(datasets: Dataset[], f: Filtros, hoy: Date = new Date()): Dataset[] {
  const periodo = PERIODOS.find((p) => p.valor === f.periodo);
  const desde = periodo ? mesHace(hoy, periodo.meses) : null;
  const resultado = datasets.filter((d) => {
    if (f.sector !== "todos" && d.sector !== f.sector) return false;
    if (f.comuna !== "todas" && d.comuna !== f.comuna) return false;
    // Entra si tiene datos en los últimos N meses
    if (desde && d.periodo_fin < desde) return false;
    if (d.calidad.total < f.puntaje[0] || d.calidad.total > f.puntaje[1]) return false;
    if (d.precio < f.precio[0] || d.precio > f.precio[1]) return false;
    return coincideTexto(d, f.texto);
  });
  return resultado.sort((a, b) => {
    if (f.orden === "precio_asc") return a.precio - b.precio;
    if (f.orden === "precio_desc") return b.precio - a.precio;
    if (f.orden === "recientes") return b.fecha_publicacion.localeCompare(a.fecha_publicacion);
    return b.calidad.total - a.calidad.total;
  });
}

/** Cuántos OTROS datasets publicados hay del mismo sector en la misma comuna. */
export function contarCompetencia(datasets: Dataset[], sector: Sector, comuna: string, excluirId?: string) {
  return datasets.filter((d) => d.sector === sector && d.comuna === comuna && d.id !== excluirId).length;
}

// ---------------- Datasets del vendedor ----------------

export const leerMisDatasets = () => leer<Dataset[]>(CLAVES.misDatasets, []);

/** Guarda (o reemplaza) un dataset del vendedor. */
export function guardarDatasetUsuario(dataset: Dataset): boolean {
  const lista = leerMisDatasets().filter((d) => d.id !== dataset.id);
  return guardar(CLAVES.misDatasets, [...lista, dataset]);
}

/** Cambia el estado: borrador, publicado o retirado. */
export function cambiarEstado(id: string, estado: EstadoDataset) {
  const lista = leerMisDatasets().map((d) => (d.id === id ? { ...d, estado } : d));
  guardar(CLAVES.misDatasets, lista);
}

// ---------------- Estado del catálogo en la dirección (URL) ----------------
// Los filtros, la zona, el sector, la pestaña y la capa viven en la URL:
// se mantienen al cambiar de pestaña, al ir al detalle de un dataset y volver.

export type PestanaCatalogo = "datasets" | "mapa" | "oportunidades";
const PESTANAS: PestanaCatalogo[] = ["datasets", "mapa", "oportunidades"];
const ORDENES: Orden[] = ["puntaje", "precio_asc", "precio_desc", "recientes"];

export interface BusquedaCatalogo {
  pestana?: PestanaCatalogo;
  /** id de la zona, ej. "laureles-estadio" */
  zona?: string;
  sector?: Sector;
  texto?: string;
  periodo?: string;
  pmin?: number;
  pmax?: number;
  cmin?: number;
  cmax?: number;
  orden?: Orden;
  capa?: Capa;
}

const esNumero = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

/** Lee la URL y conserva solo los valores válidos */
export function validarBusqueda(s: Record<string, unknown>): BusquedaCatalogo {
  const r: BusquedaCatalogo = {};
  const pestana = s["pestana"];
  if (PESTANAS.includes(pestana as PestanaCatalogo)) r.pestana = pestana as PestanaCatalogo;
  const zona = s["zona"];
  if (typeof zona === "string" && buscarZona(zona)) r.zona = zona;
  const sector = s["sector"];
  if (typeof sector === "string" && sector in NOMBRES_SECTOR) r.sector = sector as Sector;
  const texto = s["texto"];
  if (typeof texto === "string" && texto) r.texto = texto.slice(0, 100);
  const periodo = s["periodo"];
  if (PERIODOS.some((p) => p.valor === String(periodo))) r.periodo = String(periodo);
  for (const k of ["pmin", "pmax", "cmin", "cmax"] as const) {
    const v = s[k];
    if (esNumero(v)) r[k] = v;
  }
  const orden = s["orden"];
  if (ORDENES.includes(orden as Orden)) r.orden = orden as Orden;
  const capa = s["capa"];
  if (CAPAS.some((c) => c.id === capa)) r.capa = capa as Capa;
  return r;
}

const dentro = (v: number | undefined, [min, max]: [number, number], defecto: number) =>
  v === undefined ? defecto : Math.max(min, Math.min(max, v));

/** URL -> filtros de la pestaña Datasets */
export function filtrosDesdeBusqueda(b: BusquedaCatalogo): Filtros {
  return {
    texto: b.texto ?? "",
    sector: b.sector ?? "todos",
    comuna: buscarZona(b.zona)?.nombre ?? "todas",
    periodo: b.periodo ?? "todos",
    puntaje: [dentro(b.pmin, LIMITES_PUNTAJE, LIMITES_PUNTAJE[0]), dentro(b.pmax, LIMITES_PUNTAJE, LIMITES_PUNTAJE[1])],
    precio: [dentro(b.cmin, LIMITES_PRECIO, LIMITES_PRECIO[0]), dentro(b.cmax, LIMITES_PRECIO, LIMITES_PRECIO[1])],
    orden: b.orden ?? "puntaje",
  };
}

/** Filtros -> URL (sin los valores por defecto, para que quede corta) */
export function busquedaDesdeFiltros(f: Filtros): BusquedaCatalogo {
  const r: BusquedaCatalogo = {};
  const zona = zonaPorNombre(f.comuna);
  if (zona) r.zona = zona.id;
  if (f.sector !== "todos") r.sector = f.sector;
  if (f.texto) r.texto = f.texto;
  if (f.periodo !== "todos") r.periodo = f.periodo;
  if (f.puntaje[0] !== LIMITES_PUNTAJE[0]) r.pmin = f.puntaje[0];
  if (f.puntaje[1] !== LIMITES_PUNTAJE[1]) r.pmax = f.puntaje[1];
  if (f.precio[0] !== LIMITES_PRECIO[0]) r.cmin = f.precio[0];
  if (f.precio[1] !== LIMITES_PRECIO[1]) r.cmax = f.precio[1];
  if (f.orden !== "puntaje") r.orden = f.orden;
  return r;
}
