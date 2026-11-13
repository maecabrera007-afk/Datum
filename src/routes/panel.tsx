// =============================================================
//  Mi panel: datasets y ganancias del negocio, o compras del comprador
// =============================================================
import { createFileRoute, Link } from "@tanstack/react-router";
import { Download } from "lucide-react";
import { toast } from "sonner";

import { Cargando, EncabezadoPagina, EstadoVacio, InsigniaEstado, Pagina, RequiereSesion } from "@/components/datum/comunes";
import { Button } from "@/components/ui/button";
import { CLAVES, useAlmacen } from "@/lib/datum/almacen";
import { buscarDataset, cambiarEstado } from "@/lib/datum/catalogo";
import { datasetACsv, descargarArchivo, nombreArchivo, PORCENTAJE_VENDEDOR } from "@/lib/datum/compra";
import { fechaLegible, numero, pesos } from "@/lib/datum/formato";
import { NOMBRES_SECTOR, type Compra, type Dataset, type Usuario } from "@/lib/datum/tipos";

export const Route = createFileRoute("/panel")({
  head: () => ({
    meta: [
      { title: "Mi panel — Datum" },
      { name: "description", content: "Tus datasets publicados y ganancias, o tus compras y descargas en Datum." },
      { property: "og:title", content: "Mi panel — Datum" },
      { property: "og:description", content: "Administra tus datasets, ganancias y compras." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <RequiereSesion>
      {(u) => (u.rol === "vendedor" ? <PanelVendedor usuario={u} /> : <PanelComprador usuario={u} />)}
    </RequiereSesion>
  ),
});

function Cifras({ items }: { items: { titulo: string; valor: string }[] }) {
  return (
    <ul className="mt-10 grid grid-cols-1 gap-px overflow-hidden rounded-[var(--radius)] border bg-border sm:grid-cols-3">
      {items.map((c) => (
        <li key={c.titulo} className="bg-background p-6">
          <p className="eyebrow">{c.titulo}</p>
          <p className="cifra mt-3 text-4xl font-semibold">{c.valor}</p>
        </li>
      ))}
    </ul>
  );
}

// ---------------- Vendedor ----------------
function PanelVendedor({ usuario }: { usuario: Usuario }) {
  const misDatasets = useAlmacen<Dataset[]>(CLAVES.misDatasets, []);
  const compras = useAlmacen<Compra[]>(CLAVES.compras, []);
  if (misDatasets === undefined || compras === undefined) return <Cargando />;

  const mios = misDatasets.filter((d) => d.vendedorId === usuario.id);
  const ventasDe = (id: string) => compras.filter((c) => c.datasetId === id);
  const ventas = compras.filter((c) => mios.some((d) => d.id === c.datasetId));
  const ganancias = ventas.reduce((s, c) => s + c.pagoVendedor, 0);

  const cambiar = (d: Dataset) => {
    const nuevo = d.estado === "publicado" ? "retirado" : "publicado";
    cambiarEstado(d.id, nuevo);
    toast.success(nuevo === "publicado" ? "Tu dataset volvió al catálogo." : "Retiraste tu dataset del catálogo.");
  };

  return (
    <Pagina>
      <EncabezadoPagina
        etiqueta={[usuario.negocio, usuario.sector && NOMBRES_SECTOR[usuario.sector], usuario.comuna].filter(Boolean).join(" · ")}
        titulo={`Hola, ${usuario.nombre}`}
        descripcion="Tus datasets y lo que has ganado. Ganancias simuladas."
      >
        <Button asChild variant="outline">
          <Link to="/dashboard">Ver mi tablero</Link>
        </Button>
        <Button asChild>
          <Link to="/subir">Subir ventas</Link>
        </Button>
      </EncabezadoPagina>

      <Cifras
        items={[
          { titulo: "Datasets publicados", valor: numero(mios.filter((d) => d.estado === "publicado").length) },
          { titulo: "Ventas", valor: numero(ventas.length) },
          { titulo: `Ganancias (${PORCENTAJE_VENDEDOR * 100} %)`, valor: pesos(ganancias) },
        ]}
      />

      <section className="mt-14">
        <h2 className="text-2xl font-semibold">Mis datasets</h2>
        {mios.length === 0 ? (
          <div className="mt-6">
            <EstadoVacio
              titulo="Todavía no tienes datasets"
              texto="Sube tus ventas, revisa tu tablero y publica una versión anónima cuando quieras."
              accion={
                <Button asChild>
                  <Link to="/dashboard">Ir a mi tablero</Link>
                </Button>
              }
            />
          </div>
        ) : (
          <ul className="mt-6 grid gap-3">
            {mios.map((d) => {
              const suyas = ventasDe(d.id);
              return (
                <li key={d.id} className="tarjeta grid gap-4 p-5 md:grid-cols-[1fr_auto] md:items-center">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {d.estado && <InsigniaEstado estado={d.estado} />}
                      <span className="text-xs text-muted-foreground">Puntaje {d.calidad.total}/100</span>
                    </div>
                    <Link to="/catalogo/$id" params={{ id: d.id }} className="mt-2 block truncate text-lg font-semibold hover:underline">
                      {d.titulo}
                    </Link>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {pesos(d.precio)} · {suyas.length} venta(s) · ganaste {pesos(suyas.reduce((s, c) => s + c.pagoVendedor, 0))}
                    </p>
                  </div>
                  <Button variant={d.estado === "publicado" ? "outline" : "default"} onClick={() => cambiar(d)}>
                    {d.estado === "publicado" ? "Retirar del catálogo" : "Publicar"}
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </Pagina>
  );
}

// ---------------- Comprador ----------------
function PanelComprador({ usuario }: { usuario: Usuario }) {
  const misDatasets = useAlmacen<Dataset[]>(CLAVES.misDatasets, []);
  const compras = useAlmacen<Compra[]>(CLAVES.compras, []);
  if (misDatasets === undefined || compras === undefined) return <Cargando />;

  const mias = compras.filter((c) => c.compradorId === usuario.id).sort((a, b) => b.fecha.localeCompare(a.fecha));
  const gastado = mias.reduce((s, c) => s + c.precio, 0);

  return (
    <Pagina>
      <EncabezadoPagina etiqueta="Comprador" titulo={`Hola, ${usuario.nombre}`} descripcion="Tus compras y descargas. Pagos simulados.">
        <Button asChild>
          <Link to="/catalogo">Ver el catálogo</Link>
        </Button>
      </EncabezadoPagina>

      <Cifras
        items={[
          { titulo: "Datasets comprados", valor: numero(mias.length) },
          { titulo: "Total pagado", valor: pesos(gastado) },
          { titulo: "Última compra", valor: mias[0] ? fechaLegible(mias[0].fecha) : "—" },
        ]}
      />

      <section className="mt-14">
        <h2 className="text-2xl font-semibold">Mis compras</h2>
        {mias.length === 0 ? (
          <div className="mt-6">
            <EstadoVacio
              titulo="Aún no has comprado datasets"
              texto="Explora el catálogo y filtra por sector, comuna y periodo."
              accion={
                <Button asChild>
                  <Link to="/catalogo">Ir al catálogo</Link>
                </Button>
              }
            />
          </div>
        ) : (
          <ul className="mt-6 grid gap-3">
            {mias.map((c) => {
              const d = buscarDataset(c.datasetId, misDatasets);
              return (
                <li key={c.id} className="tarjeta grid gap-4 p-5 md:grid-cols-[1fr_auto] md:items-center">
                  <div className="min-w-0">
                    {d ? (
                      <Link to="/catalogo/$id" params={{ id: d.id }} className="block truncate text-lg font-semibold hover:underline">
                        {c.titulo}
                      </Link>
                    ) : (
                      <p className="truncate text-lg font-semibold">{c.titulo}</p>
                    )}
                    <p className="mt-1 text-sm text-muted-foreground">
                      {fechaLegible(c.fecha)} · {pesos(c.precio)}
                    </p>
                  </div>
                  {d ? (
                    <Button onClick={() => descargarArchivo(nombreArchivo(d), datasetACsv(d))}>
                      <Download /> Descargar CSV
                    </Button>
                  ) : (
                    <p className="text-sm text-muted-foreground">Ya no está disponible</p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </Pagina>
  );
}
