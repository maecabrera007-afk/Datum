// =============================================================
//  formato.ts — Utilidades para mostrar números y fechas
// =============================================================

/** Formatea pesos colombianos: 45000 -> "$ 45.000" */
export function pesos(valor: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(valor);
}

/** Número con separador de miles: 12500 -> "12.500" */
export function numero(valor: number, decimales = 0): string {
  return new Intl.NumberFormat("es-CO", {
    maximumFractionDigits: decimales,
    minimumFractionDigits: 0,
  }).format(valor);
}

const MESES_CORTOS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

/** "2026-03" -> "mar 2026" */
export function mesLegible(periodo: string): string {
  const [anio, mes] = periodo.split("-");
  const indice = Number(mes) - 1;
  return `${MESES_CORTOS[indice] ?? mes} ${anio}`;
}

/** Fecha ISO -> "9 nov 2026" */
export function fechaLegible(iso: string): string {
  const fecha = new Date(iso);
  return `${fecha.getDate()} ${MESES_CORTOS[fecha.getMonth()]} ${fecha.getFullYear()}`;
}
