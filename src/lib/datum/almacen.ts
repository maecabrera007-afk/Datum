// =============================================================
//  almacen.ts — Persistencia en localStorage
//  Toda la app guarda sus datos en el navegador (no hay servidor).
// =============================================================
import { useEffect, useState } from "react";

/** Claves que usamos en localStorage */
export const CLAVES = {
  usuarios: "datum_usuarios",
  sesion: "datum_sesion",
  trabajo: "datum_trabajo",
  misDatasets: "datum_mis_datasets",
  compras: "datum_compras",
} as const;

// Nombre del evento que avisa a la interfaz que algo cambió
const EVENTO_CAMBIO = "datum-almacen";

/** Lee un valor de localStorage y lo convierte de JSON. */
export function leer<T>(clave: string, porDefecto: T): T {
  if (typeof window === "undefined") return porDefecto;
  try {
    const texto = window.localStorage.getItem(clave);
    return texto ? (JSON.parse(texto) as T) : porDefecto;
  } catch {
    return porDefecto;
  }
}

/** Guarda un valor en localStorage. Devuelve false si no hay espacio. */
export function guardar<T>(clave: string, valor: T): boolean {
  try {
    window.localStorage.setItem(clave, JSON.stringify(valor));
    window.dispatchEvent(new Event(EVENTO_CAMBIO));
    return true;
  } catch {
    return false;
  }
}

/** Borra una clave de localStorage. */
export function borrar(clave: string) {
  window.localStorage.removeItem(clave);
  window.dispatchEvent(new Event(EVENTO_CAMBIO));
}

/** Crea un identificador corto y único */
export function crearId(prefijo = "id"): string {
  return `${prefijo}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Hook de React: lee una clave y se actualiza cuando cambia.
 * Devuelve `undefined` mientras la página aún no carga en el navegador,
 * para evitar diferencias entre el servidor y el navegador.
 */
export function useAlmacen<T>(clave: string, porDefecto: T): T | undefined {
  const [valor, setValor] = useState<T | undefined>(undefined);

  useEffect(() => {
    const actualizar = () => setValor(leer(clave, porDefecto));
    actualizar();
    window.addEventListener(EVENTO_CAMBIO, actualizar);
    window.addEventListener("storage", actualizar);
    return () => {
      window.removeEventListener(EVENTO_CAMBIO, actualizar);
      window.removeEventListener("storage", actualizar);
    };
    // porDefecto se usa solo como respaldo; no hace falta volver a suscribirse.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave]);

  return valor;
}
