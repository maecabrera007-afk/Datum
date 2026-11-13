// =============================================================
//  calidad.ts — Puntaje de calidad de 0 a 100
//  Se calcula con 4 componentes, cada uno de 0 a 100:
//   · Completitud  (35 %): celdas con dato / celdas esperadas
//   · Duplicados   (20 %): 100 − % de filas repetidas
//   · Consistencia (25 %): formatos válidos y totales que cuadran
//   · Atípicos     (20 %): 100 − % de filas con valores extremos
// =============================================================
import type { ColumnaEstandar, Calidad, FilaLimpia, Mapeo, ResumenLimpieza } from "./tipos";

export const PESOS = { completitud: 0.35, duplicados: 0.2, consistencia: 0.25, atipicos: 0.2 };

/** Puntaje mínimo para poder publicar un dataset */
export const UMBRAL_PUBLICACION = 70;

export const puedePublicar = (puntaje: number) => puntaje >= UMBRAL_PUBLICACION;

const redondear = (n: number) => Math.round(n * 10) / 10;

/** Combina los 4 componentes con sus pesos. */
export function puntajeTotal(c: Omit<Calidad, "total">): number {
  return Math.round(
    c.completitud * PESOS.completitud +
      c.duplicados * PESOS.duplicados +
      c.consistencia * PESOS.consistencia +
      c.atipicos * PESOS.atipicos,
  );
}

/** Cuartil (q entre 0 y 1) de una lista ordenada */
function cuartil(ordenados: number[], q: number): number {
  const pos = (ordenados.length - 1) * q;
  const base = Math.floor(pos);
  const resto = pos - base;
  return ordenados[base] + (ordenados[base + 1] - ordenados[base] || 0) * resto;
}

/**
 * Marca filas con valores atípicos extremos en cantidad, precio o total.
 * Se usa el rango intercuartílico (RIC): fuera de [Q1 − 3·RIC, Q3 + 3·RIC],
 * o valores negativos.
 */
export function filasAtipicas(filas: FilaLimpia[]): Set<number> {
  const atipicas = new Set<number>();
  for (const c of ["cantidad", "precio_unitario", "total"] as const) {
    const valores = filas.map((f) => f[c]).filter((v): v is number => v !== null);
    if (valores.length < 4) continue;
    const ordenados = [...valores].sort((a, b) => a - b);
    const q1 = cuartil(ordenados, 0.25);
    const q3 = cuartil(ordenados, 0.75);
    const ric = q3 - q1;
    const min = q1 - 3 * ric;
    const max = q3 + 3 * ric;
    filas.forEach((f, i) => {
      const v = f[c];
      if (v !== null && (v < 0 || v < min || v > max)) atipicas.add(i);
    });
  }
  return atipicas;
}

/** Calcula el puntaje de calidad con su desglose. */
export function calcularCalidad(
  filas: FilaLimpia[],
  mapeo: Mapeo,
  resumen: ResumenLimpieza,
  celdasTipadas: number,
): Calidad {
  // --- Completitud ---
  const mapeadas = new Set(Object.values(mapeo).filter((v) => v !== "ignorar") as ColumnaEstandar[]);
  if (mapeadas.has("cantidad") && mapeadas.has("precio_unitario")) mapeadas.add("total");
  const esperadas = filas.length * mapeadas.size;
  let conDato = 0;
  for (const f of filas) for (const c of mapeadas) if (f[c] !== null) conDato += 1;
  const completitud = esperadas ? (conDato / esperadas) * 100 : 0;

  // --- Duplicados ---
  const base = resumen.filasOriginales - resumen.filasVaciasEliminadas;
  const duplicados = base ? (1 - resumen.duplicadosEliminados / base) * 100 : 0;

  // --- Consistencia ---
  // a) Formatos que se pudieron interpretar
  const invalidos = resumen.fechasInvalidas + resumen.numerosInvalidos;
  const formatos = celdasTipadas ? 1 - invalidos / celdasTipadas : 1;
  // b) Total ≈ cantidad × precio unitario (tolerancia 1 %)
  const comparables = filas.filter(
    (f) => f.cantidad !== null && f.precio_unitario !== null && f.total !== null,
  );
  const cuadran = comparables.filter((f) => {
    const esperado = f.cantidad! * f.precio_unitario!;
    return Math.abs(f.total! - esperado) <= Math.max(1, Math.abs(f.total!) * 0.01);
  }).length;
  const coherencia = comparables.length ? cuadran / comparables.length : 1;
  const consistencia = ((formatos + coherencia) / 2) * 100;

  // --- Atípicos ---
  const atipicos = filas.length ? (1 - filasAtipicas(filas).size / filas.length) * 100 : 0;

  const componentes = {
    completitud: redondear(completitud),
    duplicados: redondear(duplicados),
    consistencia: redondear(consistencia),
    atipicos: redondear(atipicos),
  };
  return { ...componentes, total: puntajeTotal(componentes) };
}
