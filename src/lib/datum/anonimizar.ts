// =============================================================
//  anonimizar.ts — Detección de datos personales y agregación
//  Regla de oro: los datos crudos NUNCA se publican.
// =============================================================
import { normalizarNombre } from "./csv";
import type { FilaAgregada, FilaCruda, FilaLimpia } from "./tipos";

// Palabras en el título de una columna que indican datos personales
const PALABRAS_PERSONALES = [
  "nombre cliente", "cliente", "comprador", "cedula", "cc", "documento", "identificacion", "nit",
  "telefono", "tel", "celular", "cel", "movil", "whatsapp", "correo", "email", "e mail", "mail",
  "direccion",
];

const REGEX_CORREO = /[^\s@,;]+@[^\s@,;]+\.[a-z]{2,}/gi;
// Celulares colombianos: 3XX XXX XXXX, con o sin +57
const REGEX_CELULAR = /(\+?57[\s-]?)?3\d{2}[\s-]?\d{3}[\s-]?\d{4}/g;

/** ¿El texto tiene un correo o un celular? */
function tieneDatoPersonal(texto: string): boolean {
  return new RegExp(REGEX_CORREO.source, "i").test(texto) || new RegExp(REGEX_CELULAR.source).test(texto);
}

/**
 * Busca columnas con información personal: por su título o porque
 * más del 30 % de sus valores parecen correos o celulares.
 */
export function detectarColumnasPersonales(encabezados: string[], filas: FilaCruda[]): string[] {
  return encabezados.filter((e) => {
    const nombre = normalizarNombre(e);
    const palabras = nombre.split(" ");
    const porTitulo = PALABRAS_PERSONALES.some((p) =>
      p.includes(" ") ? nombre.includes(p) : palabras.includes(p),
    );
    if (porTitulo) return true;

    const valores = filas.map((f) => f[e]?.trim()).filter(Boolean) as string[];
    if (valores.length === 0) return false;
    const conDatos = valores.filter(tieneDatoPersonal).length;
    return conDatos / valores.length > 0.3;
  });
}

/** Reemplaza correos y celulares dentro de un texto por "[dato oculto]". */
export function ocultarDatosPersonales(texto: string): { texto: string; oculto: boolean } {
  const nuevo = texto.replace(REGEX_CORREO, "[dato oculto]").replace(REGEX_CELULAR, "[dato oculto]");
  return { texto: nuevo, oculto: nuevo !== texto };
}

/** Mínimo de transacciones por grupo para que nadie pueda ser identificado */
export const MINIMO_POR_GRUPO = 3;

export interface ResultadoAgregacion {
  filas: FilaAgregada[];
  gruposCombinados: number;
  gruposSuprimidos: number;
  transaccionesUsadas: number;
}

/**
 * Agrupa las ventas por mes y categoría. Nunca incluye productos,
 * clientes ni transacciones individuales.
 * Los grupos con menos de MINIMO_POR_GRUPO ventas se combinan en
 * "otras categorías"; si aún así quedan pequeños, se eliminan.
 */
export function agregarDatos(filas: FilaLimpia[], minimo = MINIMO_POR_GRUPO): ResultadoAgregacion {
  type Acum = { transacciones: number; unidades: number; ventas: number };
  const grupos = new Map<string, Map<string, Acum>>(); // periodo -> categoría -> acumulado

  let transaccionesUsadas = 0;
  for (const f of filas) {
    if (!f.fecha_venta || f.total == null) continue;
    const periodo = f.fecha_venta.slice(0, 7);
    const categoria = f.categoria ?? "sin categoría";
    const porMes = grupos.get(periodo) ?? new Map<string, Acum>();
    const acum = porMes.get(categoria) ?? { transacciones: 0, unidades: 0, ventas: 0 };
    acum.transacciones += 1;
    acum.unidades += f.cantidad ?? 0;
    acum.ventas += f.total;
    porMes.set(categoria, acum);
    grupos.set(periodo, porMes);
    transaccionesUsadas += 1;
  }

  let gruposCombinados = 0;
  let gruposSuprimidos = 0;
  const resultado: FilaAgregada[] = [];
  const crearFila = (periodo: string, categoria: string, a: Acum): FilaAgregada => ({
    periodo,
    categoria,
    transacciones: a.transacciones,
    unidades: Math.round(a.unidades * 100) / 100,
    ventas_totales: Math.round(a.ventas),
    ticket_promedio: Math.round(a.ventas / a.transacciones),
  });

  for (const periodo of [...grupos.keys()].sort()) {
    const otras: Acum = { transacciones: 0, unidades: 0, ventas: 0 };
    let pequenos = 0;
    for (const [categoria, a] of [...grupos.get(periodo)!.entries()].sort()) {
      if (a.transacciones >= minimo) resultado.push(crearFila(periodo, categoria, a));
      else {
        pequenos += 1;
        otras.transacciones += a.transacciones;
        otras.unidades += a.unidades;
        otras.ventas += a.ventas;
      }
    }
    if (pequenos > 0) {
      if (otras.transacciones >= minimo) {
        resultado.push(crearFila(periodo, "otras categorías", otras));
        gruposCombinados += pequenos;
      } else {
        gruposSuprimidos += pequenos;
        transaccionesUsadas -= otras.transacciones;
      }
    }
  }

  return { filas: resultado, gruposCombinados, gruposSuprimidos, transaccionesUsadas };
}
