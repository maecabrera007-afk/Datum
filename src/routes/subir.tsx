// =============================================================
//  Subir datos: carga del CSV, vista previa, mapeo y limpieza
// =============================================================
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AlertTriangle, ArrowRight, FileUp, ShieldCheck } from "lucide-react";
import { useRef, useState, type DragEvent } from "react";

import { EncabezadoPagina, Pagina, RequiereSesion, Selector, TablaSimple } from "@/components/datum/comunes";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CLAVES, guardar, leer } from "@/lib/datum/almacen";
import { detectarColumnasPersonales } from "@/lib/datum/anonimizar";
import { calcularCalidad } from "@/lib/datum/calidad";
import { leerCsv, leerCsvTexto, proponerMapeo, validarArchivo, validarMapeo, type ResultadoLectura } from "@/lib/datum/csv";
import { limpiarDatos, totalCambios, type ResultadoLimpieza } from "@/lib/datum/limpieza";
import { numero } from "@/lib/datum/formato";
import { COLUMNAS_ESTANDAR, type ColumnaEstandar, type FilaCruda, type Mapeo, type Trabajo } from "@/lib/datum/tipos";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/subir")({
  head: () => ({
    meta: [
      { title: "Subir mis ventas — Datum" },
      { name: "description", content: "Sube tu CSV de ventas, revisa el mapeo de columnas y mira cómo quedan tus datos limpios." },
      { property: "og:title", content: "Subir mis ventas — Datum" },
      { property: "og:description", content: "Carga, mapeo y limpieza automática de tus datos de ventas." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <RequiereSesion rol="vendedor">{() => <Subir />}</RequiereSesion>,
});

type Lectura = { nombre: string; encabezados: string[]; filas: FilaCruda[]; personales: string[] };
type Paso = "subir" | "mapear" | "limpiar";

const PASOS: { id: Paso; texto: string }[] = [
  { id: "subir", texto: "Subir" },
  { id: "mapear", texto: "Columnas" },
  { id: "limpiar", texto: "Limpieza" },
];

function Subir() {
  const [paso, setPaso] = useState<Paso>("subir");
  const [lectura, setLectura] = useState<Lectura | null>(null);
  const [mapeo, setMapeo] = useState<Mapeo>({});
  const [limpieza, setLimpieza] = useState<ResultadoLimpieza | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const trabajoPrevio = typeof window !== "undefined" ? leer<Trabajo | null>(CLAVES.trabajo, null) : null;

  /** Procesa el resultado de la lectura y pasa al mapeo */
  const recibir = (nombre: string, r: ResultadoLectura) => {
    setCargando(false);
    if (!r.ok) return setError(r.error);
    const personales = detectarColumnasPersonales(r.encabezados, r.filas);
    setLectura({ nombre, encabezados: r.encabezados, filas: r.filas, personales });
    setMapeo(proponerMapeo(r.encabezados, personales));
    setError(null);
    setPaso("mapear");
  };

  const alElegirArchivo = async (archivo: File | undefined) => {
    if (!archivo) return;
    const problema = validarArchivo(archivo);
    if (problema) return setError(problema);
    setCargando(true);
    recibir(archivo.name, await leerCsv(archivo));
  };

  const usarEjemplo = async () => {
    setCargando(true);
    try {
      const respuesta = await fetch("/ejemplos/ventas_desordenado.csv");
      recibir("ventas_desordenado.csv", leerCsvTexto(await respuesta.text()));
    } catch {
      setCargando(false);
      setError("No pudimos cargar el archivo de ejemplo. Revisa tu conexión.");
    }
  };

  /** Ejecuta la limpieza, calcula el puntaje y guarda el trabajo */
  const limpiar = () => {
    if (!lectura) return;
    const problema = validarMapeo(mapeo);
    if (problema) return setError(problema);
    const r = limpiarDatos(lectura.filas, mapeo);
    const calidad = calcularCalidad(r.filas, mapeo, r.resumen, r.celdasTipadas);
    const trabajo: Trabajo = {
      nombreArchivo: lectura.nombre,
      encabezados: lectura.encabezados,
      filasCrudas: lectura.filas,
      mapeo,
      filasLimpias: r.filas,
      resumen: r.resumen,
      calidad,
      columnasPersonales: lectura.personales,
      fecha: new Date().toISOString(),
    };
    if (!guardar(CLAVES.trabajo, trabajo))
      return setError("Tu archivo es muy grande para guardarlo en este navegador. Prueba con menos filas.");
    setLimpieza(r);
    setError(null);
    setPaso("limpiar");
  };

  return (
    <Pagina>
      <EncabezadoPagina
        etiqueta="Ordenar mis datos"
        titulo={paso === "subir" ? "Sube tus ventas" : paso === "mapear" ? "Revisa tus columnas" : "Así quedaron tus datos"}
        descripcion={
          paso === "subir"
            ? "Un archivo CSV con tu historial de ventas. No importa si está desordenado: para eso estamos."
            : paso === "mapear"
              ? "Propusimos a qué corresponde cada columna. Confirma o corrige lo que haga falta."
              : "Compara el antes y el después. Los cambios están resaltados."
        }
      />

      {/* Indicador de pasos */}
      <ol className="mt-8 flex gap-2 text-sm" aria-label="Pasos">
        {PASOS.map((p, i) => {
          const actual = PASOS.findIndex((x) => x.id === paso);
          return (
            <li
              key={p.id}
              aria-current={p.id === paso ? "step" : undefined}
              className={cn(
                "flex items-center gap-2 rounded-full border px-3 py-1.5",
                i === actual && "border-foreground bg-primary text-primary-foreground",
                i < actual && "border-foreground",
                i > actual && "text-muted-foreground",
              )}
            >
              <span className="cifra">{i + 1}</span> {p.texto}
            </li>
          );
        })}
      </ol>

      {error && (
        <p role="alert" className="mt-6 flex items-start gap-3 rounded-[var(--radius)] border border-destructive/40 px-4 py-3 text-sm text-destructive">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" /> {error}
        </p>
      )}

      <div className="mt-10">
        {paso === "subir" && (
          <PasoSubir
            cargando={cargando}
            alElegir={alElegirArchivo}
            usarEjemplo={usarEjemplo}
            trabajoPrevio={trabajoPrevio?.nombreArchivo}
          />
        )}
        {paso === "mapear" && lectura && (
          <PasoMapear
            lectura={lectura}
            mapeo={mapeo}
            cambiar={(col, valor) => setMapeo({ ...mapeo, [col]: valor })}
            volver={() => setPaso("subir")}
            limpiar={limpiar}
          />
        )}
        {paso === "limpiar" && lectura && limpieza && (
          <PasoLimpiar lectura={lectura} mapeo={mapeo} limpieza={limpieza} volver={() => setPaso("mapear")} />
        )}
      </div>
    </Pagina>
  );
}

// ---------------- Paso 1: subir ----------------
function PasoSubir({
  cargando,
  alElegir,
  usarEjemplo,
  trabajoPrevio,
}: {
  cargando: boolean;
  alElegir: (f: File | undefined) => void;
  usarEjemplo: () => void;
  trabajoPrevio?: string;
}) {
  const entrada = useRef<HTMLInputElement>(null);
  const [encima, setEncima] = useState(false);

  const soltar = (e: DragEvent) => {
    e.preventDefault();
    setEncima(false);
    alElegir(e.dataTransfer.files[0]);
  };

  return (
    <div className="grid gap-6">
      {trabajoPrevio && (
        <div className="tarjeta flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm">
            Ya tienes un archivo procesado: <strong>{trabajoPrevio}</strong>. Si subes otro, lo reemplazará.
          </p>
          <Button asChild variant="outline" size="sm">
            <Link to="/dashboard">Ver su tablero</Link>
          </Button>
        </div>
      )}

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setEncima(true);
        }}
        onDragLeave={() => setEncima(false)}
        onDrop={soltar}
        className={cn(
          "flex flex-col items-center justify-center gap-5 rounded-[var(--radius)] border border-dashed px-6 py-16 text-center transition-colors md:py-24",
          encima ? "border-foreground bg-accent" : "border-foreground/25",
        )}
      >
        <span className="flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <FileUp className="size-6" />
        </span>
        <div>
          <p className="font-display text-2xl font-medium">Arrastra tu archivo aquí</p>
          <p className="mt-1 text-sm text-muted-foreground">o elígelo desde tu celular o computador · solo .csv, hasta 5 MB</p>
        </div>
        <input
          ref={entrada}
          type="file"
          accept=".csv,text/csv"
          className="sr-only"
          id="archivo"
          onChange={(e) => {
            alElegir(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
        <Button size="lg" onClick={() => entrada.current?.click()} disabled={cargando}>
          {cargando ? "Leyendo…" : "Elegir archivo"}
        </Button>
      </div>

      <div className="flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted-foreground">¿No tienes un archivo a mano? Prueba con uno de ejemplo, lleno de errores a propósito.</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={usarEjemplo} disabled={cargando}>
            Usar archivo de ejemplo
          </Button>
          <Button asChild variant="link" size="sm">
            <a href="/ejemplos/ventas_desordenado.csv" download>
              Descargarlo
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}

// ---------------- Paso 2: vista previa y mapeo ----------------
const ETIQUETAS: Record<ColumnaEstandar, string> = {
  fecha_venta: "fecha_venta",
  producto: "producto",
  categoria: "categoria",
  cantidad: "cantidad",
  precio_unitario: "precio_unitario",
  total: "total",
  ciudad: "ciudad",
};

function PasoMapear({
  lectura,
  mapeo,
  cambiar,
  volver,
  limpiar,
}: {
  lectura: Lectura;
  mapeo: Mapeo;
  cambiar: (columna: string, valor: ColumnaEstandar | "ignorar") => void;
  volver: () => void;
  limpiar: () => void;
}) {
  const problema = validarMapeo(mapeo);
  return (
    <div className="grid gap-12">
      <section>
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-2xl font-semibold">Vista previa</h2>
          <p className="text-sm text-muted-foreground">
            {lectura.nombre} · {numero(lectura.filas.length)} filas · primeras 10
          </p>
        </div>
        <TablaSimple
          titulo="Primeras 10 filas del archivo"
          columnas={lectura.encabezados}
          filas={lectura.filas.slice(0, 10).map((f) => lectura.encabezados.map((e) => f[e]))}
        />
      </section>

      <section>
        <h2 className="text-2xl font-semibold">¿Qué es cada columna?</h2>
        {lectura.personales.length > 0 && (
          <p className="mt-3 flex items-start gap-2 text-sm">
            <ShieldCheck className="mt-0.5 size-4 shrink-0" />
            Encontramos datos personales en: <strong>{lectura.personales.join(", ")}</strong>. Esas columnas no se
            usarán ni se publicarán nunca.
          </p>
        )}
        <ul className="mt-6 grid gap-3">
          {lectura.encabezados.map((col) => {
            const personal = lectura.personales.includes(col);
            const ejemplos = lectura.filas.map((f) => f[col]?.trim()).filter(Boolean).slice(0, 3);
            return (
              <li key={col} className="tarjeta grid gap-3 p-4 sm:grid-cols-[1fr_16rem] sm:items-center">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">«{col}»</span>
                    {personal && <Badge variant="default">Dato personal</Badge>}
                  </div>
                  <p className="mt-1 truncate text-sm text-muted-foreground">
                    Ej.: {ejemplos.length ? ejemplos.join(" · ") : "sin datos"}
                  </p>
                </div>
                <label className="sr-only" htmlFor={`map-${col}`}>
                  Columna estándar para {col}
                </label>
                <Selector
                  id={`map-${col}`}
                  value={mapeo[col]}
                  disabled={personal}
                  onChange={(e) => cambiar(col, e.target.value as ColumnaEstandar | "ignorar")}
                >
                  <option value="ignorar">No usar esta columna</option>
                  {COLUMNAS_ESTANDAR.map((c) => (
                    <option key={c} value={c}>
                      → {ETIQUETAS[c]}
                    </option>
                  ))}
                </Selector>
              </li>
            );
          })}
        </ul>
      </section>

      <div className="flex flex-col-reverse gap-3 border-t pt-8 sm:flex-row sm:items-center sm:justify-between">
        <Button variant="ghost" onClick={volver}>
          Subir otro archivo
        </Button>
        <div className="flex flex-col items-stretch gap-2 sm:items-end">
          {problema && <p className="text-sm text-muted-foreground">{problema}</p>}
          <Button size="lg" onClick={limpiar}>
            Limpiar mis datos <ArrowRight />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ---------------- Paso 3: antes y después ----------------
function PasoLimpiar({
  lectura,
  mapeo,
  limpieza,
  volver,
}: {
  lectura: Lectura;
  mapeo: Mapeo;
  limpieza: ResultadoLimpieza;
  volver: () => void;
}) {
  const navegar = useNavigate();
  const [vista, setVista] = useState<"despues" | "antes">("despues");
  const r = limpieza.resumen;

  // Columnas estándar usadas, y de qué columna original vienen
  const usadas = COLUMNAS_ESTANDAR.filter((c) => Object.values(mapeo).includes(c) || (c === "total" && r.totalesCalculados > 0));
  const origenDe = (c: ColumnaEstandar) => Object.keys(mapeo).find((k) => mapeo[k] === c);

  const primeras = limpieza.filas.slice(0, 10);
  const antes = primeras.map((_, i) => {
    const cruda = lectura.filas[limpieza.origen[i]];
    return usadas.map((c) => {
      const col = origenDe(c);
      return col ? cruda[col] : "";
    });
  });
  const despues = primeras.map((f) => usadas.map((c) => (f[c] === null ? null : String(f[c]))));
  const cambio = (i: number, j: number) => (antes[i][j] ?? "") !== (despues[i][j] ?? "");

  const tarjetas = [
    { n: r.fechasNormalizadas, t: "fechas pasadas a AAAA-MM-DD" },
    { n: r.numerosConvertidos, t: "precios y cantidades convertidos a número" },
    { n: r.espaciosRecortados, t: "textos con espacios de más" },
    { n: r.textosUnificados, t: "textos pasados a minúsculas" },
    { n: r.duplicadosEliminados, t: "filas duplicadas eliminadas" },
    { n: r.filasVaciasEliminadas, t: "filas vacías eliminadas" },
    { n: r.totalesCalculados, t: "totales calculados (cantidad × precio)" },
    { n: r.filasIncompletas, t: "filas incompletas marcadas" },
  ];

  return (
    <div className="grid gap-12">
      <section className="grid gap-6 md:grid-cols-[1fr_2fr]">
        <div className="rounded-[var(--radius)] bg-primary p-8 text-primary-foreground">
          <p className="eyebrow">Cambios hechos</p>
          <p className="cifra mt-3 text-7xl font-semibold text-accent">{numero(totalCambios(r))}</p>
          <p className="mt-4 text-sm opacity-80">
            De {numero(r.filasOriginales)} filas quedaron {numero(r.filasFinales)} limpias.
          </p>
        </div>
        <ul className="grid grid-cols-2 gap-px overflow-hidden rounded-[var(--radius)] border bg-border sm:grid-cols-4">
          {tarjetas.map((c) => (
            <li key={c.t} className="bg-background p-4">
              <p className="cifra text-3xl font-semibold">{numero(c.n)}</p>
              <p className="mt-1 text-xs text-muted-foreground">{c.t}</p>
            </li>
          ))}
        </ul>
      </section>

      {(r.fechasInvalidas > 0 || r.numerosInvalidos > 0) && (
        <p className="text-sm text-muted-foreground">
          No pudimos entender {r.fechasInvalidas} fecha(s) y {r.numerosInvalidos} número(s); quedaron vacíos y
          bajan un poco tu puntaje.
        </p>
      )}

      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-semibold">Antes y después</h2>
          <div className="inline-flex rounded-full border p-1" role="tablist" aria-label="Vista">
            {(["antes", "despues"] as const).map((v) => (
              <button
                key={v}
                role="tab"
                aria-selected={vista === v}
                onClick={() => setVista(v)}
                className={cn(
                  "cursor-pointer rounded-full px-4 py-1.5 text-sm",
                  vista === v ? "bg-primary text-primary-foreground" : "text-muted-foreground",
                )}
              >
                {v === "antes" ? "Antes" : "Después"}
              </button>
            ))}
          </div>
        </div>
        <TablaSimple
          titulo={vista === "antes" ? "Datos antes de limpiar" : "Datos después de limpiar"}
          columnas={usadas}
          filas={vista === "antes" ? antes : despues}
          resaltar={cambio}
        />
        <p className="mt-3 text-xs text-muted-foreground">
          Las celdas en verde cambiaron. «—» significa que la celda está vacía.
        </p>
      </section>

      <div className="flex flex-col-reverse gap-3 border-t pt-8 sm:flex-row sm:justify-between">
        <Button variant="ghost" onClick={volver}>
          Corregir columnas
        </Button>
        <Button size="lg" onClick={() => navegar({ to: "/dashboard" })}>
          Ver mi puntaje y tablero <ArrowRight />
        </Button>
      </div>
    </div>
  );
}
