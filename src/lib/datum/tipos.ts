// =============================================================
//  Tipos compartidos de Datum
//  Aquí se describe la "forma" de los datos que usa la app.
// =============================================================

/** Rol del usuario en la plataforma */
export type Rol = "vendedor" | "comprador";

/** Sector del negocio */
export type Sector = "tienda_barrio" | "restaurante" | "cafe" | "panaderia";

export const NOMBRES_SECTOR: Record<Sector, string> = {
  tienda_barrio: "Tienda de barrio",
  restaurante: "Restaurante",
  cafe: "Café",
  panaderia: "Panadería",
};

/** Usuario registrado (simulado, guardado en localStorage) */
export interface Usuario {
  id: string;
  nombre: string;
  correo: string;
  /** Solo para la simulación. En un sistema real NUNCA se guarda así. */
  clave: string;
  rol: Rol;
  negocio?: string;
  sector?: Sector;
  comuna?: string;
  creado: string;
}

/** Columnas estándar a las que mapeamos cualquier CSV de ventas */
export const COLUMNAS_ESTANDAR = [
  "fecha_venta",
  "producto",
  "categoria",
  "cantidad",
  "precio_unitario",
  "total",
  "ciudad",
] as const;

export type ColumnaEstandar = (typeof COLUMNAS_ESTANDAR)[number];

/** Mapeo: columna original del CSV -> columna estándar (o "ignorar") */
export type Mapeo = Record<string, ColumnaEstandar | "ignorar">;

/** Fila cruda: tal como viene en el CSV (todo texto) */
export type FilaCruda = Record<string, string>;

/** Fila limpia: ya con tipos correctos */
export interface FilaLimpia {
  fecha_venta: string | null; // AAAA-MM-DD
  producto: string | null;
  categoria: string | null;
  cantidad: number | null;
  precio_unitario: number | null;
  total: number | null;
  ciudad: string | null;
  /** true si a la fila le falta algún dato */
  incompleta: boolean;
}

/** Resumen de los cambios hechos en la limpieza */
export interface ResumenLimpieza {
  filasOriginales: number;
  filasFinales: number;
  espaciosRecortados: number;
  textosUnificados: number;
  fechasNormalizadas: number;
  fechasInvalidas: number;
  numerosConvertidos: number;
  numerosInvalidos: number;
  totalesCalculados: number;
  duplicadosEliminados: number;
  filasVaciasEliminadas: number;
  filasIncompletas: number;
}

/** Desglose del puntaje de calidad (cada componente de 0 a 100) */
export interface Calidad {
  total: number;
  completitud: number;
  duplicados: number;
  consistencia: number;
  atipicos: number;
}

/** Fila agregada y anónima: lo único que se publica */
export interface FilaAgregada {
  periodo: string; // AAAA-MM
  categoria: string;
  transacciones: number;
  unidades: number;
  ventas_totales: number;
  ticket_promedio: number;
}

/** Factores usados en la fórmula del precio */
export interface FactoresPrecio {
  base: number;
  tamano: number;
  calidad: number;
  actualidad: number;
  escasez: number;
}

/** Estado de un dataset del vendedor */
export type EstadoDataset = "borrador" | "publicado" | "retirado";

/** Dataset del catálogo (de ejemplo o publicado por un vendedor) */
export interface Dataset {
  id: string;
  titulo: string;
  descripcion: string;
  sector: Sector;
  comuna: string;
  ciudad: string;
  periodo_inicio: string; // AAAA-MM
  periodo_fin: string; // AAAA-MM
  fecha_publicacion: string; // AAAA-MM-DD
  transacciones: number;
  calidad: Calidad;
  factores: FactoresPrecio;
  precio: number;
  filas: FilaAgregada[];
  origen: "ejemplo" | "usuario";
  /** Solo para datasets de usuarios */
  vendedorId?: string;
  estado?: EstadoDataset;
}

/** Trabajo en curso del vendedor (CSV subido y su limpieza) */
export interface Trabajo {
  nombreArchivo: string;
  encabezados: string[];
  filasCrudas: FilaCruda[];
  mapeo: Mapeo;
  filasLimpias: FilaLimpia[];
  resumen: ResumenLimpieza;
  calidad: Calidad;
  columnasPersonales: string[];
  fecha: string;
}

/** Compra simulada */
export interface Compra {
  id: string;
  datasetId: string;
  titulo: string;
  compradorId: string;
  precio: number;
  /** 70 % del precio para el vendedor */
  pagoVendedor: number;
  fecha: string;
}
