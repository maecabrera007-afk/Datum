// =============================================================
//  auth.ts — Registro e inicio de sesión SIMULADOS
//  Los usuarios se guardan en localStorage. No hay seguridad real.
// =============================================================
import { CLAVES, borrar, crearId, guardar, leer, useAlmacen } from "./almacen";
import type { Rol, Sector, Usuario } from "./tipos";

export interface DatosRegistro {
  nombre: string;
  correo: string;
  clave: string;
  rol: Rol;
  negocio?: string;
  sector?: Sector;
  comuna?: string;
}

type Resultado = { ok: true; usuario: Usuario } | { ok: false; error: string };

const normalizarCorreo = (correo: string) => correo.trim().toLowerCase();

/** Registra un usuario nuevo y abre su sesión. */
export function registrar(datos: DatosRegistro): Resultado {
  const correo = normalizarCorreo(datos.correo);
  if (!datos.nombre.trim()) return { ok: false, error: "Escribe tu nombre." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo))
    return { ok: false, error: "Ese correo no parece válido." };
  if (datos.clave.length < 6)
    return { ok: false, error: "La contraseña debe tener al menos 6 caracteres." };
  if (datos.rol === "vendedor" && (!datos.negocio?.trim() || !datos.sector || !datos.comuna))
    return { ok: false, error: "Cuéntanos el nombre, el tipo y la comuna de tu negocio." };

  const usuarios = leer<Usuario[]>(CLAVES.usuarios, []);
  if (usuarios.some((u) => u.correo === correo))
    return { ok: false, error: "Ya existe una cuenta con ese correo. Inicia sesión." };

  const usuario: Usuario = {
    id: crearId("usr"),
    nombre: datos.nombre.trim(),
    correo,
    clave: datos.clave,
    rol: datos.rol,
    negocio: datos.negocio?.trim(),
    sector: datos.sector,
    comuna: datos.comuna,
    creado: new Date().toISOString(),
  };
  guardar(CLAVES.usuarios, [...usuarios, usuario]);
  guardar(CLAVES.sesion, usuario.id);
  return { ok: true, usuario };
}

/** Inicia sesión con correo y contraseña. */
export function iniciarSesion(correo: string, clave: string): Resultado {
  const usuarios = leer<Usuario[]>(CLAVES.usuarios, []);
  const usuario = usuarios.find((u) => u.correo === normalizarCorreo(correo));
  if (!usuario || usuario.clave !== clave)
    return { ok: false, error: "El correo o la contraseña no coinciden." };
  guardar(CLAVES.sesion, usuario.id);
  return { ok: true, usuario };
}

/** Cierra la sesión actual. */
export function cerrarSesion() {
  borrar(CLAVES.sesion);
}

/** Devuelve el usuario con sesión abierta (o null). */
export function usuarioActual(): Usuario | null {
  const id = leer<string | null>(CLAVES.sesion, null);
  if (!id) return null;
  return leer<Usuario[]>(CLAVES.usuarios, []).find((u) => u.id === id) ?? null;
}

/**
 * Hook: usuario actual. `undefined` = cargando, `null` = sin sesión.
 */
export function useUsuario(): Usuario | null | undefined {
  const id = useAlmacen<string | null>(CLAVES.sesion, null);
  const usuarios = useAlmacen<Usuario[]>(CLAVES.usuarios, []);
  if (id === undefined || usuarios === undefined) return undefined;
  if (!id) return null;
  return usuarios.find((u) => u.id === id) ?? null;
}
