// =============================================================
//  Piezas de interfaz para mostrar datasets del catálogo
// =============================================================
import { Link } from "@tanstack/react-router";
import { BadgeCheck } from "lucide-react";

import { Barra, TablaSimple } from "@/components/datum/comunes";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { esVerificado } from "@/lib/datum/catalogo";
import { mesLegible, numero, pesos } from "@/lib/datum/formato";
import { NOMBRES_SECTOR, type Dataset, type FactoresPrecio, type FilaAgregada } from "@/lib/datum/tipos";

/** Tarjeta de un dataset en el catálogo */
export function TarjetaDataset({ dataset }: { dataset: Dataset }) {
  const verificado = esVerificado(dataset);
  return (
    <article className="tarjeta flex h-full flex-col gap-5 p-6">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline">{NOMBRES_SECTOR[dataset.sector]}</Badge>
        {verificado && (
          <Badge variant="acento">
            <BadgeCheck className="size-3.5" aria-hidden /> Verificado
          </Badge>
        )}
        {dataset.origen === "usuario" && <Badge variant="default">Nuevo</Badge>}
      </div>
      <div>
        <h2 className="text-xl font-semibold leading-tight">{dataset.titulo}</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {dataset.comuna} · {mesLegible(dataset.periodo_inicio)} – {mesLegible(dataset.periodo_fin)}
        </p>
      </div>
      <div className="grid gap-2">
        <div className="flex items-baseline justify-between text-sm">
          <span className="text-muted-foreground">Calidad</span>
          <span className="cifra font-medium">{dataset.calidad.total}/100</span>
        </div>
        <Barra valor={dataset.calidad.total} />
      </div>
      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t pt-4">
        <span className="cifra text-2xl font-semibold">{pesos(dataset.precio)}</span>
        <Button asChild variant="outline" size="sm">
          <Link to="/catalogo/$id" params={{ id: dataset.id }} aria-label={`Ver detalle de ${dataset.titulo}`}>
            Ver detalle
          </Link>
        </Button>
      </div>
    </article>
  );
}

/** Desglose de la fórmula del precio */
export function FormulaPrecio({ factores, precio }: { factores: FactoresPrecio; precio: number }) {
  const partes = [
    { nombre: "Base", valor: pesos(factores.base), ayuda: "Precio de partida" },
    { nombre: "Tamaño", valor: `× ${numero(factores.tamano, 2)}`, ayuda: "Cuántas ventas resume" },
    { nombre: "Calidad", valor: `× ${numero(factores.calidad, 2)}`, ayuda: "Según el puntaje de calidad" },
    { nombre: "Actualidad", valor: `× ${numero(factores.actualidad, 2)}`, ayuda: "Qué tan recientes son los datos" },
    { nombre: "Escasez", valor: `× ${numero(factores.escasez, 2)}`, ayuda: "Pocos datasets iguales en la comuna" },
  ];
  return (
    <div className="tarjeta p-6">
      <p className="eyebrow">Cómo se calcula el precio</p>
      <ul className="mt-4 grid">
        {partes.map((p) => (
          <li key={p.nombre} className="flex items-baseline justify-between gap-4 border-b py-3 text-sm">
            <span>
              <span className="font-medium">{p.nombre}</span>
              <span className="text-muted-foreground"> · {p.ayuda}</span>
            </span>
            <span className="cifra shrink-0 font-medium">{p.valor}</span>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex items-baseline justify-between gap-4">
        <span className="text-sm text-muted-foreground">Redondeado al millar</span>
        <span className="cifra whitespace-nowrap text-3xl font-semibold">= {pesos(precio)}</span>
      </div>
    </div>
  );
}

export const COLUMNAS_AGREGADAS = [
  "periodo",
  "categoria",
  "transacciones",
  "unidades",
  "ventas_totales",
  "ticket_promedio",
];

/** Tabla con las filas agregadas (lo único que se publica) */
export function TablaAgregada({ filas, titulo }: { filas: FilaAgregada[]; titulo: string }) {
  return (
    <TablaSimple
      titulo={titulo}
      columnas={COLUMNAS_AGREGADAS}
      filas={filas.map((f) => [
        mesLegible(f.periodo),
        f.categoria,
        numero(f.transacciones),
        numero(f.unidades, 2),
        pesos(f.ventas_totales),
        pesos(f.ticket_promedio),
      ])}
    />
  );
}
