// =============================================================
//  limpieza.ts — Limpieza automática de los datos
//  Fechas a AAAA-MM-DD, textos sin espacios extra y en minúsculas,
//  números con $ o comas convertidos, duplicados y filas vacías fuera.
// =============================================================
import { ocultarDatosPersonales } from "./anonimizar";
import type { ColumnaEstandar, FilaCruda, FilaLimpia, Mapeo, ResumenLimpieza } from "./tipos";

// ---------------- Textos ----------------

/** Quita espacios de más y pasa todo a minúsculas. */
export function limpiarTexto(valor: string): {
  valor: string | null;
  recortado: boolean;
  unificado: boolean;
} {
  const sinEspacios = valor.replace(/\s+/g, " ").trim();
  const minusculas = sinEspacios.toLowerCase();
  return {
    valor: minusculas === "" ? null : minusculas,
    recortado: sinEspacios !== valor,
    unificado: minusculas !== sinEspacios,
  };
}

// ---------------- Fechas ----------------

const MESES: Record<string, number> = {
  ene: 1, jan: 1, feb: 2, mar: 3, abr: 4, apr: 4, may: 5, jun: 6, jul: 7,
  ago: 8, aug: 8, sep: 9, set: 9, oct: 10, nov: 11, dic: 12, dec: 12,
};

/** Arma "AAAA-MM-DD" si la fecha existe en el calendario. */
function armarFecha(anio: number, mes: number, dia: number): string | null {
  if (anio < 100) anio += 2000;
  if (mes < 1 || mes > 12 || dia < 1 || dia > 31) return null;
  const prueba = new Date(Date.UTC(anio, mes - 1, dia));
  if (prueba.getUTCMonth() !== mes - 1) return null; // ej. 31 de febrero
  return `${anio}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}

/**
 * Convierte fechas comunes a AAAA-MM-DD.
 * Acepta: 2026-03-15, 15/03/2026, 15-03-26, 15 mar 2026, 15 de marzo de 2026.
 * Si es ambigua (ej. 03/04/2026) se asume día/mes, como se usa en Colombia.
 */
export function normalizarFecha(valor: string): string | null {
  const v = valor.trim().toLowerCase();
  if (!v) return null;

  // Año primero: 2026-03-15 o 2026/03/15 (puede traer hora después)
  let m = v.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (m) return armarFecha(Number(m[1]), Number(m[2]), Number(m[3]));

  // Día primero: 15/03/2026, 15-03-26, 15.03.2026
  m = v.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})$/);
  if (m) {
    let dia = Number(m[1]);
    let mes = Number(m[2]);
    if (mes > 12 && dia <= 12) [dia, mes] = [mes, dia]; // venía mes/día
    return armarFecha(Number(m[3]), mes, dia);
  }

  // Con nombre del mes: 15 mar 2026, 15-mar-2026, 15 de marzo de 2026
  m = v.match(/^(\d{1,2})[\s\-/]*(?:de\s+)?([a-záéíóú]+)\.?[\s\-/]*(?:de\s+|del\s+)?(\d{2,4})$/);
  if (m) {
    const mes = MESES[(m[2] ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").slice(0, 3)];
    if (!mes) return null;
    return armarFecha(Number(m[3]), mes, Number(m[1]));
  }
  return null;
}

// ---------------- Números ----------------

/**
 * Convierte "$12.500", "12,500", "3.200,50" o "COP 4500" a número.
 * Regla: si hay punto y coma, el último es el decimal. Si solo hay uno
 * y le siguen exactamente 3 dígitos, es separador de miles.
 */
export function convertirNumero(valor: string): number | null {
  let s = valor.trim().replace(/cop|pesos|\$|\s/gi, "");
  if (!s) return null;
  if (!/^-?[\d.,]+$/.test(s)) return null;

  const tienePunto = s.includes(".");
  const tieneComa = s.includes(",");
  if (tienePunto && tieneComa) {
    const decimal = s.lastIndexOf(".") > s.lastIndexOf(",") ? "." : ",";
    const miles = decimal === "." ? "," : ".";
    s = s.split(miles).join("").replace(decimal, ".");
  } else if (tienePunto || tieneComa) {
    const sep = tienePunto ? "." : ",";
    const partes = s.split(sep);
    const esMiles = partes.length > 2 || (partes[partes.length - 1] ?? "").length === 3;
    s = esMiles ? partes.join("") : partes.join(".");
  }
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

// ---------------- Limpieza completa ----------------

const TEXTOS: ColumnaEstandar[] = ["producto", "categoria", "ciudad"];
const NUMEROS: ColumnaEstandar[] = ["cantidad", "precio_unitario", "total"];

export interface ResultadoLimpieza {
  filas: FilaLimpia[];
  resumen: ResumenLimpieza;
  /** Índice de la fila cruda de la que salió cada fila limpia (para el antes/después) */
  origen: number[];
  /** Celdas de fecha y número que tenían algo escrito (para el puntaje) */
  celdasTipadas: number;
  /** Textos donde se ocultó un correo o celular */
  datosOcultados: number;
}

/** Aplica toda la limpieza a las filas, según el mapeo elegido. */
export function limpiarDatos(filasCrudas: FilaCruda[], mapeo: Mapeo): ResultadoLimpieza {
  const resumen: ResumenLimpieza = {
    filasOriginales: filasCrudas.length,
    filasFinales: 0,
    espaciosRecortados: 0,
    textosUnificados: 0,
    fechasNormalizadas: 0,
    fechasInvalidas: 0,
    numerosConvertidos: 0,
    numerosInvalidos: 0,
    totalesCalculados: 0,
    duplicadosEliminados: 0,
    filasVaciasEliminadas: 0,
    filasIncompletas: 0,
  };
  let celdasTipadas = 0;
  let datosOcultados = 0;

  // Columna estándar -> columna original del CSV
  const origenDe = new Map<ColumnaEstandar, string>();
  for (const [original, estandar] of Object.entries(mapeo)) {
    if (estandar !== "ignorar") origenDe.set(estandar, original);
  }
  // Columnas que la fila "debería" tener (para marcarla como incompleta)
  const esperadas = new Set<ColumnaEstandar>(origenDe.keys());
  if (origenDe.has("cantidad") && origenDe.has("precio_unitario")) esperadas.add("total");

  const vistas = new Set<string>();
  const filas: FilaLimpia[] = [];
  const origen: number[] = [];

  filasCrudas.forEach((cruda, indice) => {
    const crudo = (c: ColumnaEstandar) => {
      const col = origenDe.get(c);
      return col ? (cruda[col] ?? "") : "";
    };

    // 1. Filas vacías: todas las columnas asignadas están en blanco
    if ([...origenDe.keys()].every((c) => crudo(c).trim() === "")) {
      resumen.filasVaciasEliminadas += 1;
      return;
    }

    const limpia: FilaLimpia = {
      fecha_venta: null, producto: null, categoria: null, cantidad: null,
      precio_unitario: null, total: null, ciudad: null, incompleta: false,
    };

    // 2. Textos
    for (const c of TEXTOS) {
      const valor = crudo(c);
      if (!valor) continue;
      const r = limpiarTexto(valor);
      if (r.recortado) resumen.espaciosRecortados += 1;
      if (r.unificado) resumen.textosUnificados += 1;
      let texto = r.valor;
      if (texto) {
        const o = ocultarDatosPersonales(texto);
        if (o.oculto) datosOcultados += 1;
        texto = o.texto;
      }
      (limpia[c] as string | null) = texto;
    }

    // 3. Fecha
    const fechaCruda = crudo("fecha_venta").trim();
    if (fechaCruda) {
      celdasTipadas += 1;
      const fecha = normalizarFecha(fechaCruda);
      if (fecha === null) resumen.fechasInvalidas += 1;
      else if (fecha !== fechaCruda) resumen.fechasNormalizadas += 1;
      limpia.fecha_venta = fecha;
    }

    // 4. Números
    for (const c of NUMEROS) {
      const valor = crudo(c).trim();
      if (!valor) continue;
      celdasTipadas += 1;
      const n = convertirNumero(valor);
      if (n === null) resumen.numerosInvalidos += 1;
      else if (String(n) !== valor) resumen.numerosConvertidos += 1;
      (limpia[c] as number | null) = n;
    }

    // 5. Total faltante = cantidad × precio unitario
    if (limpia.total === null && limpia.cantidad !== null && limpia.precio_unitario !== null) {
      limpia.total = Math.round(limpia.cantidad * limpia.precio_unitario * 100) / 100;
      resumen.totalesCalculados += 1;
    }

    // 6. Duplicados (se comparan ya limpios)
    const llave = JSON.stringify(limpia);
    if (vistas.has(llave)) {
      resumen.duplicadosEliminados += 1;
      return;
    }
    vistas.add(llave);

    // 7. Marcar filas incompletas (se conservan, pero se señalan)
    limpia.incompleta = [...esperadas].some((c) => limpia[c] === null);
    if (limpia.incompleta) resumen.filasIncompletas += 1;

    filas.push(limpia);
    origen.push(indice);
  });

  resumen.filasFinales = filas.length;
  return { filas, resumen, origen, celdasTipadas, datosOcultados };
}

/** Total de cambios hechos (para mostrar un solo número) */
export function totalCambios(r: ResumenLimpieza): number {
  return (
    r.espaciosRecortados + r.textosUnificados + r.fechasNormalizadas + r.numerosConvertidos +
    r.totalesCalculados + r.duplicadosEliminados + r.filasVaciasEliminadas
  );
}
