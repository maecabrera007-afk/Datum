// =============================================================
//  Detalle de un dataset: muestra, puntaje, precio y compra simulada
// =============================================================
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Download } from "lucide-react";
import { toast } from "sonner";

import { Cargando, DesglosePuntaje, EstadoVacio, InsigniaEstado, Pagina } from "@/components/datum/comunes";
import { FormulaPrecio, TablaAgregada } from "@/components/datum/dataset";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CLAVES, useAlmacen } from "@/lib/datum/almacen";
import { useUsuario } from "@/lib/datum/auth";
import { buscarDataset, EJEMPLOS } from "@/lib/datum/catalogo";
import { comprar, datasetACsv, descargarArchivo, nombreArchivo, pagoVendedor, PORCENTAJE_VENDEDOR, yaComprado } from "@/lib/datum/compra";
import { fechaLegible, mesLegible, numero, pesos } from "@/lib/datum/formato";
import { NOMBRES_SECTOR, type Compra, type Dataset } from "@/lib/datum/tipos";

export const Route = createFileRoute("/catalogo/$id")({
  head: ({ params }) => {
    const d = EJEMPLOS.find((x) => x.id === params.id);
    const titulo = d ? `${d.titulo} — Datum` : "Dataset de ventas — Datum";
    const descripcion = d
      ? `${NOMBRES_SECTOR[d.sector]} en ${d.comuna}. Puntaje ${d.calidad.total}/100, ${pesos(d.precio)}.`
      : "Ventas anónimas de un negocio de Medellín, con puntaje de calidad y precio transparente.";
    return {
      meta: [
        { title: titulo },
        { name: "description", content: descripcion },
        { property: "og:title", content: titulo },
        { property: "og:description", content: descripcion },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
  component: Detalle,
});

const MUESTRA = 8;

function Detalle() {
  const { id } = Route.useParams();
  const misDatasets = useAlmacen<Dataset[]>(CLAVES.misDatasets, []);
  const ejemplo = EJEMPLOS.find((d) => d.id === id);
  const dataset = ejemplo ?? (misDatasets ? buscarDataset(id, misDatasets) : undefined);

  if (!dataset) {
    if (misDatasets === undefined) return <Cargando />;
    return (
      <Pagina>
        <EstadoVacio
          titulo="No encontramos este dataset"
          texto="Puede que lo hayan retirado o que el enlace esté mal escrito."
          accion={
            <Button asChild>
              <Link to="/catalogo">Volver al catálogo</Link>
            </Button>
          }
        />
      </Pagina>
    );
  }

  return (
    <Pagina>
      <Link to="/catalogo" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Catálogo
      </Link>

      <header className="mt-6 grid gap-8 border-b pb-10 md:grid-cols-[1.4fr_1fr] md:items-end">
        <div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{NOMBRES_SECTOR[dataset.sector]}</Badge>
            <Badge variant="outline">{dataset.comuna}</Badge>
            {dataset.origen === "usuario" && dataset.estado && <InsigniaEstado estado={dataset.estado} />}
          </div>
          <h1 className="mt-5 text-4xl font-semibold leading-[1.05] md:text-6xl">{dataset.titulo}</h1>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">{dataset.descripcion}</p>
        </div>
        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-[var(--radius)] border bg-border text-sm">
          {[
            ["Periodo", `${mesLegible(dataset.periodo_inicio)} – ${mesLegible(dataset.periodo_fin)}`],
            ["Ventas resumidas", numero(dataset.transacciones)],
            ["Publicado", fechaLegible(`${dataset.fecha_publicacion}T12:00:00`)],
            ["Ciudad", dataset.ciudad],
          ].map(([t, v]) => (
            <div key={t} className="bg-background p-4">
              <dt className="text-xs text-muted-foreground">{t}</dt>
              <dd className="mt-1 font-medium">{v}</dd>
            </div>
          ))}
        </dl>
      </header>

      <div className="mt-12 grid gap-12 lg:grid-cols-[1.5fr_1fr]">
        <div className="grid content-start gap-12">
          <section>
            <DesglosePuntaje calidad={dataset.calidad} compacto />
          </section>
          <section>
            <div className="mb-4 flex items-baseline justify-between gap-4">
              <h2 className="text-2xl font-semibold">Muestra</h2>
              <p className="text-sm text-muted-foreground">
                {Math.min(MUESTRA, dataset.filas.length)} de {numero(dataset.filas.length)} filas
              </p>
            </div>
            <TablaAgregada titulo="Muestra del dataset" filas={dataset.filas.slice(0, MUESTRA)} />
            <p className="mt-3 text-xs text-muted-foreground">
              Totales por mes y categoría. No incluye productos, clientes ni ventas individuales.
            </p>
          </section>
        </div>
        <aside className="grid content-start gap-4">
          <PanelCompra dataset={dataset} />
          <FormulaPrecio factores={dataset.factores} precio={dataset.precio} />
        </aside>
      </div>
    </Pagina>
  );
}

function PanelCompra({ dataset }: { dataset: Dataset }) {
  const usuario = useUsuario();
  const compras = useAlmacen<Compra[]>(CLAVES.compras, []);
  const disponible = dataset.origen === "ejemplo" || dataset.estado === "publicado";
  const comprado = !!usuario && !!compras && yaComprado(compras, dataset.id, usuario.id);

  const descargar = () => descargarArchivo(nombreArchivo(dataset), datasetACsv(dataset));
  const alComprar = () => {
    if (!usuario) return;
    const r = comprar(dataset, usuario);
    if (!r.ok) return void toast.error(r.error);
    toast.success("¡Compra lista! Ya puedes descargar el CSV.");
  };

  let accion: React.ReactNode = null;
  if (usuario === undefined || compras === undefined) accion = null;
  else if (comprado)
    accion = (
      <Button size="lg" variant="acento" className="w-full" onClick={descargar}>
        <Download /> Descargar CSV
      </Button>
    );
  else if (!usuario)
    accion = (
      <Button asChild size="lg" variant="acento" className="w-full">
        <Link to="/registro" search={{ rol: "comprador" }}>
          Crear cuenta de comprador
        </Link>
      </Button>
    );
  else if (usuario.id === dataset.vendedorId)
    accion = (
      <Button asChild size="lg" variant="invertido" className="w-full">
        <Link to="/panel">Es tu dataset · ir a mi panel</Link>
      </Button>
    );
  else if (usuario.rol !== "comprador")
    accion = <p className="text-sm opacity-80">Solo las cuentas de comprador pueden comprar datasets.</p>;
  else if (!disponible) accion = <p className="text-sm opacity-80">Este dataset ya no está disponible.</p>;
  else
    accion = (
      <Button size="lg" variant="acento" className="w-full" onClick={alComprar}>
        Comprar por {pesos(dataset.precio)}
      </Button>
    );

  return (
    <div className="rounded-[var(--radius)] bg-primary p-6 text-primary-foreground">
      <p className="eyebrow">Precio</p>
      <p className="cifra mt-2 text-5xl font-semibold text-accent">{pesos(dataset.precio)}</p>
      <p className="mt-3 text-sm opacity-80">
        El negocio recibe {pesos(pagoVendedor(dataset.precio))} ({PORCENTAJE_VENDEDOR * 100} %). Pago simulado: no
        se cobra dinero real.
      </p>
      <div className="mt-6">{accion}</div>
    </div>
  );
}
