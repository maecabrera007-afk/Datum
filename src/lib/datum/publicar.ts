// =============================================================
//  publicar.ts — Convierte el trabajo del vendedor en un dataset
//  Solo se publican filas agregadas y anónimas (ver anonimizar.ts).
// =============================================================
import { agregarDatos, type ResultadoAgregacion } from "./anonimizar";
import { puedePublicar } from "./calidad";
import { contarCompetencia } from "./catalogo";
import { calcularFactores, calcularPrecio } from "./precio";
import type { Dataset, EstadoDataset, Trabajo, Usuario } from "./tipos";

/** Identificador estable: el mismo archivo del mismo vendedor reemplaza su dataset. */
export function idDatasetDe(trabajo: Trabajo, usuario: Usuario): string {
  const texto = `${usuario.id}|${trabajo.nombreArchivo}|${trabajo.fecha}`;
  let h = 0;
  for (let i = 0; i < texto.length; i++) h = (h * 31 + texto.charCodeAt(i)) >>> 0;
  return `ds_${h.toString(36)}`;
}

export interface Borrador {
  dataset: Dataset;
  agregacion: ResultadoAgregacion;
}

type Resultado = { ok: true; borrador: Borrador } | { ok: false; error: string };

/**
 * Arma el dataset a partir del trabajo limpio.
 * `catalogo` son los datasets visibles (para calcular la escasez).
 */
export function prepararDataset(
  trabajo: Trabajo,
  usuario: Usuario,
  catalogo: Dataset[],
  datos: { titulo: string; descripcion: string; estado: EstadoDataset },
  hoy: Date = new Date(),
): Resultado {
  if (usuario.rol !== "vendedor" || !usuario.sector || !usuario.comuna)
    return { ok: false, error: "Solo las cuentas de negocio pueden publicar datasets." };
  if (!puedePublicar(trabajo.calidad.total))
    return { ok: false, error: "Tu puntaje debe ser de 70 o más para publicar." };

  const agregacion = agregarDatos(trabajo.filasLimpias);
  if (agregacion.filas.length === 0)
    return { ok: false, error: "No hay suficientes ventas por mes y categoría para publicar de forma anónima." };

  const periodos = agregacion.filas.map((f) => f.periodo).sort();
  const periodoInicio = periodos[0] ?? "";
  const periodoFin = periodos[periodos.length - 1] ?? "";
  const fechaPublicacion = hoy.toISOString().slice(0, 10);
  const transacciones = agregacion.filas.reduce((s, f) => s + f.transacciones, 0);
  const id = idDatasetDe(trabajo, usuario);

  const factores = calcularFactores({
    transacciones,
    puntaje: trabajo.calidad.total,
    periodoFin,
    fechaPublicacion,
    otrosEnSectorYComuna: contarCompetencia(catalogo, usuario.sector, usuario.comuna, id),
  });

  const titulo = datos.titulo.trim() || `Ventas de ${usuario.negocio ?? "negocio"} en ${usuario.comuna}`;
  const dataset: Dataset = {
    id,
    titulo,
    descripcion: datos.descripcion.trim() || "Ventas agregadas por mes y categoría, sin datos personales.",
    sector: usuario.sector,
    comuna: usuario.comuna,
    ciudad: "Medellín",
    periodo_inicio: periodoInicio,
    periodo_fin: periodoFin,
    fecha_publicacion: fechaPublicacion,
    transacciones,
    calidad: trabajo.calidad,
    factores,
    precio: calcularPrecio(factores),
    filas: agregacion.filas,
    origen: "usuario",
    vendedorId: usuario.id,
    estado: datos.estado,
  };
  return { ok: true, borrador: { dataset, agregacion } };
}
