// Pruebas de las reglas de negocio y de la limpieza de Datum
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import datasets from "@/data/datasets.json";
import { agregarDatos, detectarColumnasPersonales } from "./anonimizar";
import { calcularCalidad, puedePublicar, puntajeTotal } from "./calidad";
import { leerCsvTexto, proponerMapeo, validarMapeo } from "./csv";
import { pagoVendedor } from "./compra";
import { convertirNumero, limpiarDatos, limpiarTexto, normalizarFecha } from "./limpieza";
import { calcularPrecio, factorActualidad, factorCalidad, factorEscasez, factorTamano } from "./precio";
import type { Dataset } from "./tipos";

describe("Reglas de negocio", () => {
  it("solo se puede publicar con puntaje de 70 o más", () => {
    expect(puedePublicar(70)).toBe(true);
    expect(puedePublicar(69)).toBe(false);
  });

  it("el vendedor recibe el 70 % de cada venta", () => {
    expect(pagoVendedor(50000)).toBe(35000);
  });

  it("precio = base × tamaño × calidad × actualidad × escasez, redondeado al millar", () => {
    const f = { base: 40000, tamano: 1.3, calidad: 1.22, actualidad: 1.3, escasez: 1.4 };
    // 40000 × 1.3 × 1.22 × 1.3 × 1.4 = 115 460,8 -> 115 000
    expect(calcularPrecio(f)).toBe(115000);
  });

  it("factores de precio según tamaño, calidad, actualidad y escasez", () => {
    expect(factorTamano(80)).toBe(0.7);
    expect(factorTamano(600)).toBe(1.3);
    expect(factorCalidad(70)).toBe(0.8);
    expect(factorCalidad(100)).toBe(1.4);
    expect(factorActualidad("2026-06", "2026-07-15")).toBe(1.3);
    expect(factorActualidad("2025-01", "2026-07-15")).toBe(0.7);
    expect(factorEscasez(0)).toBe(1.4);
    expect(factorEscasez(5)).toBe(1.0);
  });

  it("los 16 datasets de ejemplo cumplen precio (20.000–150.000), puntaje (72–98) y fórmula", () => {
    const lista = datasets as Dataset[];
    expect(lista).toHaveLength(16);
    for (const d of lista) {
      expect(d.precio).toBeGreaterThanOrEqual(20000);
      expect(d.precio).toBeLessThanOrEqual(150000);
      expect(d.calidad.total).toBeGreaterThanOrEqual(72);
      expect(d.calidad.total).toBeLessThanOrEqual(98);
      expect(calcularPrecio(d.factores)).toBe(d.precio);
      expect(puntajeTotal(d.calidad)).toBe(d.calidad.total);
    }
  });
});

describe("Limpieza", () => {
  it("normaliza fechas en distintos formatos a AAAA-MM-DD", () => {
    expect(normalizarFecha("2026-03-15")).toBe("2026-03-15");
    expect(normalizarFecha("15/03/2026")).toBe("2026-03-15");
    expect(normalizarFecha("15 mar 2026")).toBe("2026-03-15");
    expect(normalizarFecha("15 de marzo de 2026")).toBe("2026-03-15");
    expect(normalizarFecha("31/02/2026")).toBeNull();
  });

  it("convierte números con $ y comas", () => {
    expect(convertirNumero("$12.500")).toBe(12500);
    expect(convertirNumero("12,500")).toBe(12500);
    expect(convertirNumero("$ 3.200,50")).toBe(3200.5);
    expect(convertirNumero("2,5")).toBe(2.5);
    expect(convertirNumero("doce")).toBeNull();
  });

  it("quita espacios y pasa textos a minúsculas", () => {
    expect(limpiarTexto("  Arroz  DIANA ").valor).toBe("arroz diana");
  });
});

describe("Archivo de ejemplo desordenado", () => {
  const texto = readFileSync(path.resolve(__dirname, "../../../public/ejemplos/ventas_desordenado.csv"), "utf8");
  const lectura = leerCsvTexto(texto);
  if (!lectura.ok) throw new Error(lectura.error);
  const personales = detectarColumnasPersonales(lectura.encabezados, lectura.filas);
  const mapeo = proponerMapeo(lectura.encabezados, personales);
  const r = limpiarDatos(lectura.filas, mapeo);

  it("tiene 80 filas, detecta datos personales y mapea las columnas", () => {
    expect(lectura.filas).toHaveLength(80);
    expect(personales).toEqual(expect.arrayContaining(["Cliente", "Teléfono"]));
    expect(mapeo["Fecha Vta"]).toBe("fecha_venta");
    expect(mapeo["Cant."]).toBe("cantidad");
    expect(mapeo["Precio Unit"]).toBe("precio_unitario");
    expect(validarMapeo(mapeo)).toBeNull();
  });

  it("elimina los 5 duplicados y las 2 filas vacías", () => {
    expect(r.resumen.duplicadosEliminados).toBe(5);
    expect(r.resumen.filasVaciasEliminadas).toBe(2);
    expect(r.filas).toHaveLength(73);
  });

  it("obtiene un puntaje que permite publicar", () => {
    const calidad = calcularCalidad(r.filas, mapeo, r.resumen, r.celdasTipadas);
    expect(calidad.total).toBeGreaterThanOrEqual(70);
  });

  it("la agregación nunca tiene grupos con menos de 3 ventas ni productos", () => {
    const ag = agregarDatos(r.filas);
    for (const f of ag.filas) {
      expect(f.transacciones).toBeGreaterThanOrEqual(3);
      expect(Object.keys(f)).not.toContain("producto");
    }
  });
});
