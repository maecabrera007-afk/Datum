import { describe, expect, it } from "vitest";

import { EJEMPLOS, esVerificado, FILTROS_INICIALES, filtrarCatalogo, mesHace } from "./catalogo";
import { CORREGIMIENTOS, COMUNAS_ZONA, ZONAS, zonaProtegida } from "./zonas";

const HOY = new Date("2026-11-09T12:00:00Z");
const ids = (f: Partial<typeof FILTROS_INICIALES>) =>
  filtrarCatalogo(EJEMPLOS, { ...FILTROS_INICIALES, ...f }, HOY).map((d) => d.id);

describe("Catálogo", () => {
  it("la insignia Verificado aparece con puntaje de 85 o más", () => {
    const d = EJEMPLOS[0]!;
    expect(esVerificado({ ...d, calidad: { ...d.calidad, total: 85 } })).toBe(true);
    expect(esVerificado({ ...d, calidad: { ...d.calidad, total: 84 } })).toBe(false);
  });

  it("últimos 3 meses = datasets con datos desde agosto de 2026", () => {
    expect(mesHace(HOY, 3)).toBe("2026-08");
    for (const d of filtrarCatalogo(EJEMPLOS, { ...FILTROS_INICIALES, periodo: "3" }, HOY))
      expect(d.periodo_fin >= "2026-08").toBe(true);
  });

  it("los filtros se combinan: sector + zona + rango de precio", () => {
    const r = filtrarCatalogo(EJEMPLOS, { ...FILTROS_INICIALES, sector: "restaurante", comuna: "El Poblado", precio: [0, 95000] }, HOY);
    expect(r.map((d) => d.id)).toEqual(["ej-02"]);
  });

  it("el rango de puntaje deja fuera lo que está por fuera", () => {
    for (const d of filtrarCatalogo(EJEMPLOS, { ...FILTROS_INICIALES, puntaje: [90, 100] }, HOY))
      expect(d.calidad.total).toBeGreaterThanOrEqual(90);
  });

  it("la búsqueda ignora tildes y mayúsculas", () => {
    expect(ids({ texto: "PANADERIA" })).toEqual(expect.arrayContaining(["ej-13", "ej-14"]));
    expect(ids({ texto: "belen" }).length).toBeGreaterThan(0);
  });

  it("más recientes ordena por fecha de publicación", () => {
    const r = filtrarCatalogo(EJEMPLOS, { ...FILTROS_INICIALES, orden: "recientes" }, HOY);
    for (let i = 1; i < r.length; i++) expect(r[i - 1]!.fecha_publicacion >= r[i]!.fecha_publicacion).toBe(true);
  });
});

describe("Zonas", () => {
  it("hay 16 comunas y 5 corregimientos", () => {
    expect(COMUNAS_ZONA).toHaveLength(16);
    expect(CORREGIMIENTOS).toHaveLength(5);
  });

  it("entre 2 y 60 negocios, y 2 o 3 zonas protegidas por tener menos de 5", () => {
    for (const z of ZONAS) {
      expect(z.negocios_registrados).toBeGreaterThanOrEqual(2);
      expect(z.negocios_registrados).toBeLessThanOrEqual(60);
    }
    const protegidas = ZONAS.filter(zonaProtegida).length;
    expect(protegidas).toBeGreaterThanOrEqual(2);
    expect(protegidas).toBeLessThanOrEqual(3);
  });

  it("los porcentajes suman 100 y las series tienen el largo correcto", () => {
    const suma = (o: Record<string, number>) => Object.values(o).reduce((s, v) => s + v, 0);
    for (const z of ZONAS) {
      expect(suma(z.mix_negocios)).toBe(100);
      expect(suma(z.tipos_restaurante)).toBe(100);
      expect(z.afluencia_por_dia).toHaveLength(7);
      expect(z.ventas_ultimos_6_meses).toHaveLength(6);
    }
  });

  it("cada dataset de ejemplo está en una de las 21 zonas", () => {
    const nombres = new Set(ZONAS.map((z) => z.nombre));
    for (const d of EJEMPLOS) expect(nombres.has(d.comuna)).toBe(true);
  });
});

import { demanda, indiceOportunidad, nivelDe, rangoCapa, saturacion, valorCapa } from "./zonas";

describe("Índice de oportunidad y capas", () => {
  const poblado = ZONAS.find((z) => z.nombre === "El Poblado")!;

  it("índice = demanda − saturación, entre 0 y 100", () => {
    for (const z of ZONAS) {
      const i = indiceOportunidad(z, "cafes");
      expect(i).toBe(Math.max(0, Math.min(100, demanda(z) - saturacion(z, "cafes"))));
    }
  });

  it("la zona con más negocios de un tipo tiene saturación 100", () => {
    const max = ZONAS.reduce((a, b) =>
      b.negocios_registrados * b.mix_negocios.restaurantes > a.negocios_registrados * a.mix_negocios.restaurantes ? b : a,
    );
    expect(saturacion(max, "restaurantes")).toBe(100);
  });

  it("el nivel de color va de 1 a 5 y el máximo es 5 (lima)", () => {
    const rango = rangoCapa("ventas");
    expect(nivelDe(rango[0], rango)).toBe(1);
    expect(nivelDe(rango[1], rango)).toBe(5);
    expect(nivelDe(valorCapa(poblado, "ventas"), rango)).toBe(5);
  });

  it("las zonas protegidas no cuentan para el rango de la capa", () => {
    const [min] = rangoCapa("negocios");
    expect(min).toBeGreaterThanOrEqual(5);
  });
});
