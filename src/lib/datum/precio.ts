// =============================================================
//  precio.ts — Precio sugerido de un dataset
//  Precio = base × tamaño × calidad × actualidad × escasez del sector
//  (redondeado al millar más cercano)
// =============================================================
import type { FactoresPrecio } from "./tipos";

export const PRECIO_BASE = 40000; // COP

/** Tamaño: según cuántas transacciones resume el dataset. */
export function factorTamano(transacciones: number): number {
  if (transacciones < 100) return 0.7;
  if (transacciones < 500) return 1.0;
  if (transacciones < 2000) return 1.3;
  return 1.6;
}

/** Calidad: de 0,8 (puntaje 70) a 1,4 (puntaje 100), en línea recta. */
export function factorCalidad(puntaje: number): number {
  const p = Math.min(100, Math.max(70, puntaje));
  return Math.round((0.8 + ((p - 70) / 30) * 0.6) * 100) / 100;
}

/** Meses entre dos fechas "AAAA-MM" o "AAAA-MM-DD" */
export function mesesEntre(desde: string, hasta: string): number {
  const [a1 = 0, m1 = 1] = desde.split("-").map(Number);
  const [a2 = 0, m2 = 1] = hasta.split("-").map(Number);
  return (a2 - a1) * 12 + (m2 - m1);
}

/** Actualidad: meses entre el último mes de datos y la publicación. */
export function factorActualidad(periodoFin: string, fechaPublicacion: string): number {
  const meses = mesesEntre(periodoFin, fechaPublicacion);
  if (meses <= 3) return 1.3;
  if (meses <= 6) return 1.1;
  if (meses <= 12) return 1.0;
  return 0.7;
}

/** Escasez: cuántos otros datasets del mismo sector hay en la misma comuna. */
export function factorEscasez(otrosEnSectorYComuna: number): number {
  if (otrosEnSectorYComuna === 0) return 1.4;
  if (otrosEnSectorYComuna <= 2) return 1.2;
  return 1.0;
}

/** Arma todos los factores a partir de los datos del dataset. */
export function calcularFactores(datos: {
  transacciones: number;
  puntaje: number;
  periodoFin: string;
  fechaPublicacion: string;
  otrosEnSectorYComuna: number;
}): FactoresPrecio {
  return {
    base: PRECIO_BASE,
    tamano: factorTamano(datos.transacciones),
    calidad: factorCalidad(datos.puntaje),
    actualidad: factorActualidad(datos.periodoFin, datos.fechaPublicacion),
    escasez: factorEscasez(datos.otrosEnSectorYComuna),
  };
}

/** Multiplica los factores y redondea al millar. */
export function calcularPrecio(f: FactoresPrecio): number {
  const bruto = f.base * f.tamano * f.calidad * f.actualidad * f.escasez;
  return Math.round(bruto / 1000) * 1000;
}
