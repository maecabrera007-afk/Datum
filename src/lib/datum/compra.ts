// =============================================================
//  compra.ts — Compra SIMULADA y descarga en CSV
//  No se cobra dinero real. El vendedor "recibe" el 70 %.
// =============================================================
import Papa from "papaparse";
import { CLAVES, crearId, guardar, leer } from "./almacen";
import type { Compra, Dataset, Usuario } from "./tipos";

/** Porcentaje de cada venta que recibe el negocio */
export const PORCENTAJE_VENDEDOR = 0.7;

export const pagoVendedor = (precio: number) => Math.round(precio * PORCENTAJE_VENDEDOR);

export const leerCompras = () => leer<Compra[]>(CLAVES.compras, []);

/** ¿Este comprador ya tiene el dataset? */
export function yaComprado(compras: Compra[], datasetId: string, compradorId: string) {
  return compras.some((c) => c.datasetId === datasetId && c.compradorId === compradorId);
}

type Resultado = { ok: true; compra: Compra } | { ok: false; error: string };

/** Registra la compra simulada. */
export function comprar(dataset: Dataset, usuario: Usuario): Resultado {
  if (usuario.rol !== "comprador")
    return { ok: false, error: "Solo las cuentas de comprador pueden comprar datasets." };
  if (dataset.origen === "usuario" && dataset.estado !== "publicado")
    return { ok: false, error: "Este dataset ya no está disponible." };

  const compras = leerCompras();
  const existente = compras.find((c) => c.datasetId === dataset.id && c.compradorId === usuario.id);
  if (existente) return { ok: true, compra: existente };

  const compra: Compra = {
    id: crearId("cmp"),
    datasetId: dataset.id,
    titulo: dataset.titulo,
    compradorId: usuario.id,
    precio: dataset.precio,
    pagoVendedor: pagoVendedor(dataset.precio),
    fecha: new Date().toISOString(),
  };
  if (!guardar(CLAVES.compras, [...compras, compra]))
    return { ok: false, error: "No pudimos guardar la compra. Intenta de nuevo." };
  return { ok: true, compra };
}

/** Convierte las filas agregadas del dataset en texto CSV. */
export function datasetACsv(dataset: Dataset): string {
  return Papa.unparse(dataset.filas, {
    columns: ["periodo", "categoria", "transacciones", "unidades", "ventas_totales", "ticket_promedio"],
  });
}

/** Descarga un texto como archivo en el navegador. */
export function descargarArchivo(nombre: string, contenido: string, tipo = "text/csv;charset=utf-8") {
  // El "\uFEFF" ayuda a que Excel lea bien las tildes
  const blob = new Blob(["\uFEFF" + contenido], { type: tipo });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombre;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  URL.revokeObjectURL(url);
}

/** Nombre de archivo seguro a partir del título */
export function nombreArchivo(dataset: Dataset) {
  const base = dataset.titulo
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
  return `datum_${base}.csv`;
}
