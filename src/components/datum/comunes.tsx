// =============================================================
//  Componentes compartidos de la interfaz de Datum
// =============================================================
import { Link } from "@tanstack/react-router";
import type { ReactNode, SelectHTMLAttributes } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useUsuario } from "@/lib/datum/auth";
import { PESOS, UMBRAL_PUBLICACION } from "@/lib/datum/calidad";
import type { Calidad, EstadoDataset, Rol, Usuario } from "@/lib/datum/tipos";
import { cn } from "@/lib/utils";

/** Logotipo: la palabra "Datum" con un punto lima */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 font-display text-xl font-semibold tracking-tight", className)}>
      <span aria-hidden className="inline-block size-2.5 rounded-full bg-foreground ring-4 ring-accent" />
      Datum
    </span>
  );
}

/** Encabezado de cada página: etiqueta, título grande y descripción */
export function EncabezadoPagina({
  etiqueta,
  titulo,
  descripcion,
  children,
}: {
  etiqueta?: string;
  titulo: string;
  descripcion?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-6 border-b pb-8 md:flex-row md:items-end md:justify-between">
      <div className="max-w-2xl">
        {etiqueta && <p className="eyebrow mb-3">{etiqueta}</p>}
        <h1 className="text-4xl font-semibold leading-[1.05] md:text-6xl">{titulo}</h1>
        {descripcion && <p className="mt-4 text-base text-muted-foreground md:text-lg">{descripcion}</p>}
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </header>
  );
}

/** Contenedor estándar de página */
export function Pagina({ children, className }: { children: ReactNode; className?: string }) {
  return <main className={cn("mx-auto w-full max-w-6xl px-5 py-10 md:px-8 md:py-16", className)}>{children}</main>;
}

/** Mensaje de carga mientras se lee el navegador */
export function Cargando() {
  return (
    <Pagina>
      <p className="text-muted-foreground" role="status">
        Cargando…
      </p>
    </Pagina>
  );
}

/** Tarjeta vacía con mensaje y acción */
export function EstadoVacio({ titulo, texto, accion }: { titulo: string; texto: string; accion?: ReactNode }) {
  return (
    <div className="tarjeta flex flex-col items-start gap-3 p-8 md:p-12">
      <h2 className="text-2xl font-semibold">{titulo}</h2>
      <p className="max-w-lg text-muted-foreground">{texto}</p>
      {accion && <div className="mt-2">{accion}</div>}
    </div>
  );
}

/**
 * Protege una página: exige sesión y (opcional) un rol.
 * Recibe una función que pinta la página con el usuario.
 */
export function RequiereSesion({
  rol,
  children,
}: {
  rol?: Rol;
  children: (usuario: Usuario) => ReactNode;
}) {
  const usuario = useUsuario();
  if (usuario === undefined) return <Cargando />;
  if (usuario === null)
    return (
      <Pagina>
        <EstadoVacio
          titulo="Primero, entra a tu cuenta"
          texto="Para usar esta sección necesitas registrarte o iniciar sesión. Es gratis y toma un minuto."
          accion={
            <Button asChild>
              <Link to="/registro" search={{ rol: rol ?? "vendedor" }}>
                Registrarme o entrar
              </Link>
            </Button>
          }
        />
      </Pagina>
    );
  if (rol && usuario.rol !== rol)
    return (
      <Pagina>
        <EstadoVacio
          titulo={rol === "vendedor" ? "Esta sección es para negocios" : "Esta sección es para compradores"}
          texto={`Tu cuenta es de ${usuario.rol}. Crea otra cuenta como ${rol} para usar esta parte.`}
          accion={
            <Button asChild variant="outline">
              <Link to="/panel">Ir a mi panel</Link>
            </Button>
          }
        />
      </Pagina>
    );
  return <>{children(usuario)}</>;
}

/** Lista desplegable nativa (funciona muy bien en celular) */
export function Selector({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-10 w-full cursor-pointer rounded-full border border-foreground/15 bg-background px-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
      {...props}
    />
  );
}

/** Barra horizontal de 0 a 100 */
export function Barra({ valor, resaltar = false }: { valor: number; resaltar?: boolean }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-secondary" role="presentation">
      <div
        className={cn("h-full rounded-full transition-all duration-700", resaltar ? "bg-accent" : "bg-foreground")}
        style={{ width: `${Math.max(0, Math.min(100, valor))}%` }}
      />
    </div>
  );
}

const NOMBRES_COMPONENTE: Record<keyof typeof PESOS, { nombre: string; ayuda: string }> = {
  completitud: { nombre: "Completitud", ayuda: "Celdas con dato" },
  duplicados: { nombre: "Sin duplicados", ayuda: "Filas que no se repiten" },
  consistencia: { nombre: "Consistencia", ayuda: "Formatos válidos y totales que cuadran" },
  atipicos: { nombre: "Valores normales", ayuda: "Sin cifras extremas" },
};

/** Puntaje grande con el desglose de sus 4 componentes */
export function DesglosePuntaje({ calidad, compacto = false }: { calidad: Calidad; compacto?: boolean }) {
  const aprobado = calidad.total >= UMBRAL_PUBLICACION;
  return (
    <div className={cn("grid gap-8", !compacto && "md:grid-cols-[auto_1fr] md:gap-12")}>
      <div>
        <p className="eyebrow">Puntaje de calidad</p>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="cifra text-7xl font-semibold md:text-8xl">{calidad.total}</span>
          <span className="cifra text-2xl text-muted-foreground">/100</span>
        </div>
        <Badge variant={aprobado ? "acento" : "apagado"} className="mt-3">
          {aprobado ? "Listo para publicar" : `Necesita ${UMBRAL_PUBLICACION} para publicar`}
        </Badge>
      </div>
      <ul className="grid gap-5 self-center">
        {(Object.keys(PESOS) as (keyof typeof PESOS)[]).map((clave) => (
          <li key={clave} className="grid gap-2">
            <div className="flex items-baseline justify-between gap-4 text-sm">
              <span>
                <span className="font-medium">{NOMBRES_COMPONENTE[clave].nombre}</span>
                <span className="text-muted-foreground"> · {NOMBRES_COMPONENTE[clave].ayuda} · pesa {PESOS[clave] * 100} %</span>
              </span>
              <span className="cifra font-medium">{calidad[clave]}</span>
            </div>
            <Barra valor={calidad[clave]} />
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Insignia de estado de un dataset */
export function InsigniaEstado({ estado }: { estado: EstadoDataset }) {
  if (estado === "publicado") return <Badge variant="acento">Publicado</Badge>;
  if (estado === "borrador") return <Badge variant="outline">Borrador</Badge>;
  return <Badge variant="apagado">Retirado</Badge>;
}

/** Tabla sencilla y legible con desplazamiento horizontal en celular */
export function TablaSimple({
  columnas,
  filas,
  resaltar,
  titulo,
}: {
  columnas: string[];
  filas: (string | number | null)[][];
  /** Devuelve true si la celda debe resaltarse (ej. cambió en la limpieza) */
  resaltar?: (fila: number, columna: number) => boolean;
  titulo?: string;
}) {
  return (
    <div className="tarjeta overflow-x-auto">
      <table className="w-full min-w-max border-collapse text-sm">
        {titulo && <caption className="sr-only">{titulo}</caption>}
        <thead>
          <tr className="border-b">
            {columnas.map((c) => (
              <th key={c} scope="col" className="whitespace-nowrap px-4 py-3 text-left font-medium text-muted-foreground">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filas.map((fila, i) => (
            <tr key={i} className="border-b last:border-0">
              {fila.map((celda, j) => {
                const vacia = celda === null || celda === "";
                return (
                  <td
                    key={j}
                    className={cn(
                      "whitespace-pre px-4 py-2.5",
                      resaltar?.(i, j) && "bg-accent text-accent-foreground",
                      vacia && "text-muted-foreground",
                    )}
                  >
                    {vacia ? "—" : celda}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
