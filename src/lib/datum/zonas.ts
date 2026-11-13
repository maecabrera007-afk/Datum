// =============================================================
//  zonas.ts — Zonas de Medellín (datos ilustrativos de demostración)
// =============================================================
import datosZonas from "@/data/zonas.json";
import { numero, pesos } from "./formato";
import type { Sector } from "./tipos";

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
  /** Ticket promedio por compra en la zona (COP) */
  ticket_promedio: number;
  categoria_mas_vendida: string;
}

export const AVISO_ZONAS: string = datosZonas.aviso;
export const DIAS: string[] = datosZonas.dias;
export const MESES_ZONAS: string[] = datosZonas.meses;
export const DIAS_LARGOS = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];
export const ZONAS = datosZonas.zonas as Zona[];

export const COMUNAS_ZONA = ZONAS.filter((z) => z.tipo === "comuna");
export const CORREGIMIENTOS = ZONAS.filter((z) => z.tipo === "corregimiento");

/** Mínimo de negocios aportando datos para mostrar una zona sin riesgo de identificarlos */
export const MINIMO_NEGOCIOS_ZONA = 5;
export const zonaProtegida = (z: Zona) => z.negocios_registrados < MINIMO_NEGOCIOS_ZONA;

/** Zonas con datos suficientes para mostrarse */
export const ZONAS_VISIBLES = ZONAS.filter((z) => !zonaProtegida(z));

export const buscarZona = (id: string | null | undefined) => ZONAS.find((z) => z.id === id) ?? null;
export const zonaPorNombre = (nombre: string | null | undefined) => ZONAS.find((z) => z.nombre === nombre) ?? null;
export const etiquetaZona = (z: Zona) => (z.tipo === "comuna" ? `Comuna ${z.codigo}` : "Corregimiento");

// ---------------- Lecturas de la zona ----------------

/** Franja de 2 horas con más afluencia, ej. "18-20" */
export function horaPico(z: Zona): { franja: string; valor: number } {
  return z.horas_pico.reduce((a, b) => (b.valor > a.valor ? b : a), z.horas_pico[0] ?? { franja: "—", valor: 0 });
}

/** "18-20" -> "18:00 a 20:00" */
export const franjaLegible = (franja: string) => {
  const [a = "", b = ""] = franja.split("-");
  return `${a}:00 a ${b}:00`;
};

/** Día de la semana con más afluencia (índice 0 = lunes) */
export function diaPico(z: Zona): number {
  return z.afluencia_por_dia.reduce((mejor, v, i, arr) => (v > (arr[mejor] ?? 0) ? i : mejor), 0);
}

export const NOMBRES_MIX: Record<keyof Zona["mix_negocios"], string> = {
  tiendas: "Tiendas",
  restaurantes: "Restaurantes",
  cafes: "Cafés",
  panaderias: "Panaderías",
  otros: "Otros",
};

export const NOMBRES_RESTAURANTE: Record<keyof Zona["tipos_restaurante"], string> = {
  comida_rapida: "Comida rápida",
  corrientazo: "Corrientazo",
  parrilla: "Parrilla",
  comida_saludable: "Comida saludable",
  asadero: "Asadero",
  otros: "Otros",
};

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

/** Plural en minúscula para las explicaciones */
export const PLURAL_TIPO: Record<TipoNegocio, string> = {
  tiendas: "tiendas de barrio",
  restaurantes: "restaurantes",
  cafes: "cafés",
  panaderias: "panaderías",
};
const POCOS: Record<TipoNegocio, string> = { tiendas: "Pocas", restaurantes: "Pocos", cafes: "Pocos", panaderias: "Pocas" };

/** El sector del catálogo y el tipo de negocio de las zonas son lo mismo */
export const SECTOR_A_TIPO: Record<Sector, TipoNegocio> = {
  tienda_barrio: "tiendas",
  restaurante: "restaurantes",
  cafe: "cafes",
  panaderia: "panaderias",
};
export const TIPO_A_SECTOR: Record<TipoNegocio, Sector> = {
  tiendas: "tienda_barrio",
  restaurantes: "restaurante",
  cafes: "cafe",
  panaderias: "panaderia",
};

const limitar = (n: number) => Math.max(0, Math.min(100, n));

export const PESO_AFLUENCIA = 0.6;
export const PESO_VENTAS = 0.4;

/** Ventas promedio de la zona en 0–100 frente a la zona que más vende */
export function ventasNormalizadas(z: Zona, zonas: Zona[] = ZONAS): number {
  const maxVentas = Math.max(...zonas.map((x) => x.ventas_promedio_mensual));
  return maxVentas ? Math.round((z.ventas_promedio_mensual / maxVentas) * 100) : 0;
}

/** Demanda de la zona de 0 a 100 */
export function demanda(z: Zona, zonas: Zona[] = ZONAS): number {
  const maxVentas = Math.max(...zonas.map((x) => x.ventas_promedio_mensual));
  const ventas = maxVentas ? (z.ventas_promedio_mensual / maxVentas) * 100 : 0;
  return Math.round(PESO_AFLUENCIA * z.indice_afluencia + PESO_VENTAS * ventas);
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

/** Valor de la capa para una zona. En "oportunidad", si hay un tipo elegido se usa ese tipo. */
export function valorCapa(z: Zona, capa: Capa, zonas: Zona[] = ZONAS, tipo?: TipoNegocio | null): number {
  if (capa === "afluencia") return z.indice_afluencia;
  if (capa === "ventas") return z.ventas_promedio_mensual;
  if (capa === "negocios") return z.negocios_registrados;
  return tipo ? indiceOportunidad(z, tipo, zonas) : mejorOportunidad(z, zonas).indice;
}

export const NIVELES = 5;

/** Rango [mínimo, máximo] de la capa entre las zonas con datos suficientes */
export function rangoCapa(capa: Capa, zonas: Zona[] = ZONAS, tipo?: TipoNegocio | null): [number, number] {
  const valores = zonas.filter((z) => !zonaProtegida(z)).map((z) => valorCapa(z, capa, zonas, tipo));
  return [Math.min(...valores), Math.max(...valores)];
}

/** Nivel de color de 1 (más bajo) a 5 (más alto) */
export function nivelDe(valor: number, [min, max]: [number, number]): number {
  if (max <= min) return NIVELES;
  return Math.max(1, Math.min(NIVELES, Math.ceil(((valor - min) / (max - min)) * NIVELES)));
}

// ---------------- Oportunidades ----------------

export interface Oportunidad {
  zona: Zona;
  tipo: TipoNegocio;
  indice: number;
  demanda: number;
  saturacion: number;
  razones: string[];
}

/** Tres razones legibles que explican el índice */
export function razonesOportunidad(z: Zona, tipo: TipoNegocio, zonas: Zona[] = ZONAS): string[] {
  const pico = horaPico(z);
  const dia = DIAS_LARGOS[diaPico(z)] ?? "";
  const nivel = z.indice_afluencia >= 80 ? "Alta afluencia" : z.indice_afluencia >= 60 ? "Afluencia media" : "Afluencia baja";
  const razones = [
    `${nivel} de compradores (${z.indice_afluencia}/100), con pico de ${franjaLegible(pico.franja)} y el día más fuerte el ${dia}`,
  ];

  // Saturación: qué tan poca oferta hay de ese tipo
  if (tipo === "restaurantes") {
    const [hueco, pct] = (Object.entries(z.tipos_restaurante) as [keyof Zona["tipos_restaurante"], number][])
      .filter(([k]) => k !== "otros")
      .reduce((a, b) => (b[1] < a[1] ? b : a));
    razones.push(
      `${z.mix_negocios.restaurantes} % de los negocios son restaurantes y solo ${pct} % de ellos son de ${NOMBRES_RESTAURANTE[hueco].toLowerCase()}`,
    );
  } else {
    razones.push(
      `${POCOS[tipo]} ${PLURAL_TIPO[tipo]}: ${z.mix_negocios[tipo]} % de los negocios de la zona (saturación ${saturacion(z, tipo, zonas)}/100)`,
    );
  }

  // Tendencia o poder de compra
  if (z.crecimiento_trimestral > 0)
    razones.push(`Las ventas de la zona crecieron ${numero(z.crecimiento_trimestral, 1)} % en el último trimestre`);
  else razones.push(`Ventas promedio de ${pesos(z.ventas_promedio_mensual)} al mes por negocio y ticket de ${pesos(z.ticket_promedio)}`);
  return razones;
}

export function oportunidad(z: Zona, tipo: TipoNegocio, zonas: Zona[] = ZONAS): Oportunidad {
  return {
    zona: z,
    tipo,
    indice: indiceOportunidad(z, tipo, zonas),
    demanda: demanda(z, zonas),
    saturacion: saturacion(z, tipo, zonas),
    razones: razonesOportunidad(z, tipo, zonas),
  };
}

/**
 * Mejores zonas para abrir un tipo de negocio (o el mejor tipo de cada zona).
 * Las zonas protegidas por privacidad nunca aparecen.
 */
export function rankingOportunidades(tipo: TipoNegocio | null, zonas: Zona[] = ZONAS): Oportunidad[] {
  return zonas
    .filter((z) => !zonaProtegida(z))
    .map((z) => oportunidad(z, tipo ?? mejorOportunidad(z, zonas).tipo, zonas))
    .sort((a, b) => b.indice - a.indice || b.demanda - a.demanda);
}

/** Top N oportunidades, una por zona */
export const topOportunidades = (n = 5, tipo: TipoNegocio | null = null, zonas: Zona[] = ZONAS) =>
  rankingOportunidades(tipo, zonas).slice(0, n);
