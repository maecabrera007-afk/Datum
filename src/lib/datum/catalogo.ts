// =============================================================
//  catalogo.ts — Catálogo de datasets, filtros y datasets del vendedor
// =============================================================
import datasetsEjemplo from "@/data/datasets.json";
import { CLAVES, guardar, leer } from "./almacen";
import type { Dataset, EstadoDataset, Sector } from "./tipos";

/** Los 10 datasets ficticios de ejemplo */
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

/** Periodos para filtrar: semestres */
export const PERIODOS = [
  { valor: "2025-S2", etiqueta: "2.º semestre 2025", inicio: "2025-07", fin: "2025-12" },
  { valor: "2026-S1", etiqueta: "1.er semestre 2026", inicio: "2026-01", fin: "2026-06" },
  { valor: "2026-S2", etiqueta: "2.º semestre 2026", inicio: "2026-07", fin: "2026-12" },
];

export type Orden = "puntaje" | "precio_asc" | "precio_desc";

export interface Filtros {
  sector: Sector | "todos";
  comuna: string; // "todas" o el nombre
  periodo: string; // "todos" o el valor del semestre
  orden: Orden;
}

export const FILTROS_INICIALES: Filtros = {
  sector: "todos",
  comuna: "todas",
  periodo: "todos",
  orden: "puntaje",
};

/** Aplica filtros y orden al catálogo. */
export function filtrarCatalogo(datasets: Dataset[], f: Filtros): Dataset[] {
  const periodo = PERIODOS.find((p) => p.valor === f.periodo);
  const resultado = datasets.filter((d) => {
    if (f.sector !== "todos" && d.sector !== f.sector) return false;
    if (f.comuna !== "todas" && d.comuna !== f.comuna) return false;
    // El dataset entra si sus meses se cruzan con el semestre elegido
    if (periodo && (d.periodo_fin < periodo.inicio || d.periodo_inicio > periodo.fin)) return false;
    return true;
  });
  return resultado.sort((a, b) => {
    if (f.orden === "precio_asc") return a.precio - b.precio;
    if (f.orden === "precio_desc") return b.precio - a.precio;
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
