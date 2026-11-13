import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { detectarColumnasPersonales } from "./anonimizar";
import { calcularCalidad } from "./calidad";
import { EJEMPLOS } from "./catalogo";
import { leerCsvTexto, proponerMapeo } from "./csv";
import { limpiarDatos } from "./limpieza";
import { calcularPrecio } from "./precio";
import { prepararDataset } from "./publicar";
import type { Trabajo, Usuario } from "./tipos";

const texto = readFileSync(path.resolve(__dirname, "../../../public/ejemplos/ventas_desordenado.csv"), "utf8");
const lectura = leerCsvTexto(texto);
if (!lectura.ok) throw new Error(lectura.error);
const personales = detectarColumnasPersonales(lectura.encabezados, lectura.filas);
const mapeo = proponerMapeo(lectura.encabezados, personales);
const r = limpiarDatos(lectura.filas, mapeo);
const trabajo: Trabajo = {
  nombreArchivo: "ventas.csv",
  encabezados: lectura.encabezados,
  filasCrudas: lectura.filas,
  mapeo,
  filasLimpias: r.filas,
  resumen: r.resumen,
  calidad: calcularCalidad(r.filas, mapeo, r.resumen, r.celdasTipadas),
  columnasPersonales: personales,
  fecha: "2026-11-09T00:00:00.000Z",
};
const vendedor: Usuario = {
  id: "usr_1", nombre: "Ana", correo: "a@b.co", clave: "x", rol: "vendedor",
  negocio: "Tienda Ana", sector: "tienda_barrio", comuna: "Belén", creado: "2026-11-09",
};

describe("Publicar dataset", () => {
  it("el precio sale de la fórmula y no se publican productos", () => {
    const res = prepararDataset(trabajo, vendedor, EJEMPLOS, { titulo: "", descripcion: "", estado: "publicado" });
    if (!res.ok) throw new Error(res.error);
    const d = res.borrador.dataset;
    expect(d.precio).toBe(calcularPrecio(d.factores));
    expect(d.factores.base).toBe(40000);
    expect(d.vendedorId).toBe("usr_1");
    for (const f of d.filas) {
      expect(f.transacciones).toBeGreaterThanOrEqual(3);
      expect(Object.keys(f)).not.toContain("producto");
    }
  });

  it("no deja publicar con puntaje menor a 70", () => {
    const malo = { ...trabajo, calidad: { ...trabajo.calidad, total: 69 } };
    expect(prepararDataset(malo, vendedor, EJEMPLOS, { titulo: "", descripcion: "", estado: "publicado" }).ok).toBe(false);
  });

  it("un comprador no puede publicar", () => {
    const comprador: Usuario = { ...vendedor, rol: "comprador" };
    expect(prepararDataset(trabajo, comprador, EJEMPLOS, { titulo: "", descripcion: "", estado: "publicado" }).ok).toBe(false);
  });
});
