// Barra de navegación superior (se adapta al celular)
import { Link, useNavigate } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { cerrarSesion, useUsuario } from "@/lib/datum/auth";
import { Logo } from "./comunes";

export function Encabezado() {
  const usuario = useUsuario();
  const navegar = useNavigate();
  const [abierto, setAbierto] = useState(false);

  // Enlaces según el rol del usuario
  const enlaces: { a: "/catalogo" | "/subir" | "/dashboard" | "/panel"; texto: string }[] = [
    { a: "/catalogo", texto: "Catálogo" },
  ];
  if (usuario?.rol === "vendedor") {
    enlaces.push({ a: "/subir", texto: "Subir datos" }, { a: "/dashboard", texto: "Tablero" });
  }
  if (usuario) enlaces.push({ a: "/panel", texto: "Mi panel" });

  const salir = () => {
    cerrarSesion();
    setAbierto(false);
    navegar({ to: "/" });
  };

  return (
    <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 md:px-8">
        <Link to="/" aria-label="Datum, inicio" onClick={() => setAbierto(false)}>
          <Logo />
        </Link>

        {/* Navegación de escritorio */}
        <nav className="hidden items-center gap-1 md:flex" aria-label="Principal">
          {enlaces.map((e) => (
            <Link
              key={e.a}
              to={e.a}
              className="rounded-full px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
              activeProps={{ className: "text-foreground font-medium" }}
            >
              {e.texto}
            </Link>
          ))}
          {usuario ? (
            <Button variant="outline" size="sm" className="ml-3" onClick={salir}>
              Salir
            </Button>
          ) : (
            <Button asChild size="sm" className="ml-3">
              <Link to="/registro" search={{ rol: "vendedor" }}>
                Entrar
              </Link>
            </Button>
          )}
        </nav>

        {/* Botón de menú en celular */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label={abierto ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={abierto}
          onClick={() => setAbierto(!abierto)}
        >
          {abierto ? <X /> : <Menu />}
        </Button>
      </div>

      {abierto && (
        <nav className="border-t px-5 pb-6 pt-2 md:hidden" aria-label="Principal móvil">
          <ul className="grid">
            {enlaces.map((e) => (
              <li key={e.a}>
                <Link
                  to={e.a}
                  onClick={() => setAbierto(false)}
                  className="block border-b py-4 font-display text-2xl"
                >
                  {e.texto}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-6">
            {usuario ? (
              <Button variant="outline" className="w-full" onClick={salir}>
                Salir ({usuario.nombre})
              </Button>
            ) : (
              <Button asChild className="w-full">
                <Link to="/registro" search={{ rol: "vendedor" }} onClick={() => setAbierto(false)}>
                  Entrar o registrarme
                </Link>
              </Button>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}

export function PiePagina() {
  return (
    <footer className="mt-24 border-t">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-10 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between md:px-8">
        <Logo className="text-base text-foreground" />
        <p>Proyecto académico · Pagos, compradores y ganancias simulados · Medellín, Colombia</p>
      </div>
    </footer>
  );
}
