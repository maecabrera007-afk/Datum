// =============================================================
//  dashboard.ts — Cálculos para las gráficas del tablero
// =============================================================
import type { Dataset, FilaLimpia, Sector } from "./tipos";

export interface PuntoGrafica {
  nombre: string;
  valor: number;
}

/** Filas que sirven para sumar ventas (tienen total) */
const conTotal = (filas: FilaLimpia[]) => filas.filter((f) => f.total !== null);

/** Ventas por mes (AAAA-MM), en orden cronológico. */
export function ventasPorMes(filas: FilaLimpia[]): PuntoGrafica[] {
  const mapa = new Map<string, number>();
  for (const f of conTotal(filas)) {
    if (!f.fecha_venta) continue;
    const mes = f.fecha_venta.slice(0, 7);
    mapa.set(mes, (mapa.get(mes) ?? 0) + f.total!);
  }
  return [...mapa.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([nombre, valor]) => ({ nombre, valor: Math.round(valor) }));
}

/** Suma ventas agrupando por un campo de texto, de mayor a menor. */
function sumarPor(filas: FilaLimpia[], campo: "categoria" | "producto"): PuntoGrafica[] {
  const mapa = new Map<string, number>();
  for (const f of conTotal(filas)) {
    const clave = f[campo] ?? "sin dato";
    mapa.set(clave, (mapa.get(clave) ?? 0) + f.total!);
  }
  return [...mapa.entries()]
    .map(([nombre, valor]) => ({ nombre, valor: Math.round(valor) }))
    .sort((a, b) => b.valor - a.valor);
}

export const ventasPorCategoria = (filas: FilaLimpia[]) => sumarPor(filas, "categoria");

export const topProductos = (filas: FilaLimpia[], cuantos = 5) =>
  sumarPor(filas, "producto").slice(0, cuantos);

/** Total vendido, número de ventas y promedio por transacción. */
export function resumenVentas(filas: FilaLimpia[]) {
  const validas = conTotal(filas);
  const total = validas.reduce((s, f) => s + f.total!, 0);
  const meses = new Set(validas.map((f) => f.fecha_venta?.slice(0, 7)).filter(Boolean)).size;
  return {
    total: Math.round(total),
    transacciones: validas.length,
    promedio: validas.length ? Math.round(total / validas.length) : 0,
    ventasMensuales: meses ? Math.round(total / meses) : 0,
  };
}

/**
 * Promedio del sector según los datasets del catálogo:
 * ticket promedio y ventas promedio por mes.
 */
export function promedioSector(datasets: Dataset[], sector: Sector) {
  const delSector = datasets.filter((d) => d.sector === sector);
  if (delSector.length === 0) return null;
  let ventas = 0;
  let transacciones = 0;
  let mesesTotales = 0;
  for (const d of delSector) {
    ventas += d.filas.reduce((s, f) => s + f.ventas_totales, 0);
    transacciones += d.filas.reduce((s, f) => s + f.transacciones, 0);
    mesesTotales += new Set(d.filas.map((f) => f.periodo)).size;
  }
  return {
    datasets: delSector.length,
    ticketPromedio: transacciones ? Math.round(ventas / transacciones) : 0,
    ventasMensuales: mesesTotales ? Math.round(ventas / mesesTotales) : 0,
  };
}
