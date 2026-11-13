// =============================================================
//  zonas.ts — Zonas de Medellín (datos ilustrativos de demostración)
// =============================================================
import datosZonas from "@/data/zonas.json";

export type TipoZona = "comuna" | "corregimiento";

export interface Zona {
  id: string;
  codigo: number;
  nombre: string;
  tipo: TipoZona;
  negocios_registrados: number;
  indice_afluencia: number;
  ventas_promedio_mensual: number;
  /** Afluencia de lunes a domingo (0 a 100) */
  afluencia_por_dia: number[];
  /** Afluencia por franja de 2 horas (0 a 100) */
  horas_pico: { franja: string; valor: number }[];
  mix_negocios: { tiendas: number; restaurantes: number; cafes: number; panaderias: number; otros: number };
  tipos_restaurante: {
    comida_rapida: number;
    corrientazo: number;
    parrilla: number;
    comida_saludable: number;
    asadero: number;
    otros: number;
  };
  ventas_ultimos_6_meses: number[];
  crecimiento_trimestral: number;
}

export const AVISO_ZONAS: string = datosZonas.aviso;
export const DIAS: string[] = datosZonas.dias;
export const MESES_ZONAS: string[] = datosZonas.meses;
export const ZONAS = datosZonas.zonas as Zona[];

export const COMUNAS_ZONA = ZONAS.filter((z) => z.tipo === "comuna");
export const CORREGIMIENTOS = ZONAS.filter((z) => z.tipo === "corregimiento");

/** Mínimo de negocios aportando datos para mostrar una zona sin riesgo de identificarlos */
export const MINIMO_NEGOCIOS_ZONA = 5;
export const zonaProtegida = (z: Zona) => z.negocios_registrados < MINIMO_NEGOCIOS_ZONA;

// ---------------- Índice de oportunidad ----------------
// Índice = Demanda − Saturación, limitado entre 0 y 100.
//  · Demanda   = 60 % afluencia de compradores + 40 % ventas promedio
//                (las ventas se pasan a 0–100 frente a la zona que más vende)
//  · Saturación = negocios de ese tipo en la zona, en 0–100 frente a la
//                zona con más negocios de ese tipo

export const TIPOS_NEGOCIO = {
  tiendas: "Tienda de barrio",
  restaurantes: "Restaurante",
  cafes: "Café",
  panaderias: "Panadería",
} as const;

export type TipoNegocio = keyof typeof TIPOS_NEGOCIO;
export const LISTA_TIPOS = Object.keys(TIPOS_NEGOCIO) as TipoNegocio[];

const limitar = (n: number) => Math.max(0, Math.min(100, n));

/** Demanda de la zona de 0 a 100 */
export function demanda(z: Zona, zonas: Zona[] = ZONAS): number {
  const maxVentas = Math.max(...zonas.map((x) => x.ventas_promedio_mensual));
  const ventas = maxVentas ? (z.ventas_promedio_mensual / maxVentas) * 100 : 0;
  return Math.round(0.6 * z.indice_afluencia + 0.4 * ventas);
}

/** Negocios de un tipo en la zona (según su mezcla) */
export const negociosDeTipo = (z: Zona, tipo: TipoNegocio) => (z.negocios_registrados * z.mix_negocios[tipo]) / 100;

/** Saturación de 0 a 100 para un tipo de negocio */
export function saturacion(z: Zona, tipo: TipoNegocio, zonas: Zona[] = ZONAS): number {
  const max = Math.max(...zonas.map((x) => negociosDeTipo(x, tipo)));
  return max ? Math.round((negociosDeTipo(z, tipo) / max) * 100) : 0;
}

/** Índice de oportunidad de 0 a 100 para abrir un tipo de negocio en la zona */
export function indiceOportunidad(z: Zona, tipo: TipoNegocio, zonas: Zona[] = ZONAS): number {
  return limitar(demanda(z, zonas) - saturacion(z, tipo, zonas));
}

/** Mejor oportunidad de la zona entre los 4 tipos de negocio */
export function mejorOportunidad(z: Zona, zonas: Zona[] = ZONAS): { tipo: TipoNegocio; indice: number } {
  return LISTA_TIPOS.map((tipo) => ({ tipo, indice: indiceOportunidad(z, tipo, zonas) })).reduce((a, b) =>
    b.indice > a.indice ? b : a,
  );
}

// ---------------- Capas del mapa ----------------

export type Capa = "afluencia" | "ventas" | "negocios" | "oportunidad";

export const CAPAS: { id: Capa; nombre: string }[] = [
  { id: "afluencia", nombre: "Afluencia de compradores" },
  { id: "ventas", nombre: "Ventas promedio por negocio" },
  { id: "negocios", nombre: "Negocios registrados" },
  { id: "oportunidad", nombre: "Índice de oportunidad" },
];

/** Valor de la capa para una zona */
export function valorCapa(z: Zona, capa: Capa, zonas: Zona[] = ZONAS): number {
  if (capa === "afluencia") return z.indice_afluencia;
  if (capa === "ventas") return z.ventas_promedio_mensual;
  if (capa === "negocios") return z.negocios_registrados;
  return mejorOportunidad(z, zonas).indice;
}

export const NIVELES = 5;

/** Rango [mínimo, máximo] de la capa entre las zonas con datos suficientes */
export function rangoCapa(capa: Capa, zonas: Zona[] = ZONAS): [number, number] {
  const valores = zonas.filter((z) => !zonaProtegida(z)).map((z) => valorCapa(z, capa, zonas));
  return [Math.min(...valores), Math.max(...valores)];
}

/** Nivel de color de 1 (más bajo) a 5 (más alto) */
export function nivelDe(valor: number, [min, max]: [number, number]): number {
  if (max <= min) return NIVELES;
  return Math.max(1, Math.min(NIVELES, Math.ceil(((valor - min) / (max - min)) * NIVELES)));
}
