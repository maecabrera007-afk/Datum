// =============================================================
//  csv.ts — Lectura del archivo CSV y propuesta de mapeo de columnas
//  Usa PapaParse para leer el archivo.
// =============================================================
import Papa from "papaparse";
import { COLUMNAS_ESTANDAR, type ColumnaEstandar, type FilaCruda, type Mapeo } from "./tipos";

export type ResultadoLectura =
  | { ok: true; encabezados: string[]; filas: FilaCruda[] }
  | { ok: false; error: string };

const TAMANO_MAXIMO = 5 * 1024 * 1024; // 5 MB

/** Revisa el archivo antes de leerlo. Devuelve un mensaje amigable o null si todo va bien. */
export function validarArchivo(archivo: File): string | null {
  const esCsv = archivo.name.toLowerCase().endsWith(".csv") || archivo.type === "text/csv";
  if (!esCsv)
    return "Ese archivo no es un CSV. En Excel usa «Guardar como» y elige «CSV (delimitado por comas)».";
  if (archivo.size === 0) return "El archivo está vacío. Revisa que tenga tus ventas.";
  if (archivo.size > TAMANO_MAXIMO) return "El archivo pesa más de 5 MB. Prueba con menos meses.";
  return null;
}

/** Convierte el resultado de PapaParse en nuestro formato. */
function procesarResultado(resultado: Papa.ParseResult<FilaCruda>): ResultadoLectura {
  const encabezados = (resultado.meta.fields ?? []).filter((e) => e !== "");
  if (encabezados.length === 0)
    return { ok: false, error: "No encontramos títulos de columnas en la primera fila." };
  if (resultado.data.length === 0)
    return { ok: false, error: "El archivo solo tiene títulos y ninguna fila de datos." };

  // Nos aseguramos de que cada fila tenga todas las columnas como texto
  const filas = resultado.data.map((fila) => {
    const limpia: FilaCruda = {};
    for (const e of encabezados) limpia[e] = fila[e] == null ? "" : String(fila[e]);
    return limpia;
  });
  return { ok: true, encabezados, filas };
}

const OPCIONES: Papa.ParseConfig = {
  header: true,
  skipEmptyLines: true, // salta líneas totalmente en blanco (las de ",,,," sí se leen)
  transformHeader: (h) => h.replace(/^\uFEFF/, "").trim(),
};

/** Lee un archivo CSV del computador o celular. */
export function leerCsv(archivo: File): Promise<ResultadoLectura> {
  return new Promise((resolver) => {
    Papa.parse<FilaCruda, File>(archivo, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h: string) => h.replace(/^\uFEFF/, "").trim(),
      complete: (r) => resolver(procesarResultado(r)),
      error: () => resolver({ ok: false, error: "No pudimos leer el archivo. ¿Está dañado?" }),
    });
  });
}

/** Lee un CSV que ya está en texto (por ejemplo, el archivo de ejemplo). */
export function leerCsvTexto(texto: string): ResultadoLectura {
  if (!texto.trim()) return { ok: false, error: "El archivo está vacío." };
  return procesarResultado(Papa.parse<FilaCruda>(texto, OPCIONES as Papa.ParseConfig<FilaCruda>));
}

// -------------------------------------------------------------
//  Mapeo de columnas
// -------------------------------------------------------------

/** Quita tildes, pasa a minúsculas y deja solo letras y números. */
export function normalizarNombre(nombre: string): string {
  return nombre
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Palabras con las que la gente suele nombrar cada columna estándar */
export const SINONIMOS: Record<ColumnaEstandar, string[]> = {
  fecha_venta: ["fecha venta", "fecha vta", "fecha de venta", "f venta", "fecha", "fec", "dia", "date"],
  producto: ["producto", "nombre producto", "prod", "articulo", "item", "descripcion", "referencia", "plato"],
  categoria: ["categoria", "cat", "tipo", "linea", "grupo", "familia", "seccion"],
  cantidad: ["cantidad", "cant", "unidades", "und", "uds", "qty", "cuantos"],
  precio_unitario: ["precio unitario", "precio unit", "valor unitario", "vr unitario", "valor unit", "p unit", "pu", "precio und", "precio"],
  total: ["total", "valor total", "vr total", "precio total", "total venta", "importe", "monto", "subtotal"],
  ciudad: ["ciudad", "municipio", "localidad"],
};

/** Qué tan parecido es un encabezado a una columna estándar (0 = nada). */
function puntajeParecido(encabezado: string, columna: ColumnaEstandar): number {
  const h = normalizarNombre(encabezado);
  const palabrasH = h.split(" ");
  let mejor = 0;
  for (const s of SINONIMOS[columna]) {
    if (h === s || h === columna.replace("_", " ")) return 100;
    const palabrasS = s.split(" ");
    if (palabrasS.every((p) => palabrasH.includes(p))) mejor = Math.max(mejor, 50 + s.length);
    else if (h.startsWith(s)) mejor = Math.max(mejor, 30 + s.length);
  }
  return mejor;
}

/**
 * Propone un mapeo automático. Cada columna estándar se asigna como máximo
 * a una columna del CSV (gana la más parecida). Las columnas con datos
 * personales se marcan como "ignorar".
 */
export function proponerMapeo(encabezados: string[], columnasPersonales: string[] = []): Mapeo {
  const candidatos: { encabezado: string; columna: ColumnaEstandar; puntaje: number }[] = [];
  for (const e of encabezados) {
    if (columnasPersonales.includes(e)) continue;
    for (const c of COLUMNAS_ESTANDAR) {
      const puntaje = puntajeParecido(e, c);
      if (puntaje > 0) candidatos.push({ encabezado: e, columna: c, puntaje });
    }
  }
  candidatos.sort((a, b) => b.puntaje - a.puntaje);

  const mapeo: Mapeo = Object.fromEntries(encabezados.map((e) => [e, "ignorar"]));
  const usadas = new Set<string>();
  for (const { encabezado, columna } of candidatos) {
    if (usadas.has(columna) || mapeo[encabezado] !== "ignorar") continue;
    mapeo[encabezado] = columna;
    usadas.add(columna);
  }
  return mapeo;
}

/** Revisa que el mapeo tenga lo mínimo para limpiar y graficar. */
export function validarMapeo(mapeo: Mapeo): string | null {
  const valores = Object.values(mapeo).filter((v) => v !== "ignorar");
  const repetida = valores.find((v, i) => valores.indexOf(v) !== i);
  if (repetida) return `La columna «${repetida}» está asignada dos veces. Deja solo una.`;

  const tiene = (c: ColumnaEstandar) => valores.includes(c);
  const faltan: string[] = [];
  if (!tiene("fecha_venta")) faltan.push("fecha_venta");
  if (!tiene("producto")) faltan.push("producto");
  if (!tiene("categoria")) faltan.push("categoria");
  if (!tiene("total") && !(tiene("cantidad") && tiene("precio_unitario")))
    faltan.push("total (o cantidad + precio_unitario)");
  if (faltan.length) return `Faltan columnas por asignar: ${faltan.join(", ")}.`;
  return null;
}
