# Prompt v1: prompt base de Datum

**Herramienta:** Lovable
**Qué pide:** subida de CSV, mapeo de columnas, limpieza, puntaje de calidad, tablero, publicación anonimizada, catálogo y compra simulada.
**Incluye la v1.1:** al final están el nombre y la paleta que completan los campos entre corchetes.

Lo que falló y cómo se ajustó está en [`bitacora_de_pruebas.md`](bitacora_de_pruebas.md).

---

## Prompt

```
# ROL
Eres un desarrollador front-end senior y diseñador UX/UI, especializado en
plataformas de datos para pequeños negocios. Escribes código limpio, comentado
en español y fácil de entender para estudiantes.

# CONTEXTO DEL PROYECTO
Vamos a construir [NOMBRE DE LA PLATAFORMA], una plataforma web donde dueños de
pequeños negocios (tiendas de barrio y restaurantes en Medellín, Colombia)
suben sus datos desordenados (historial de ventas, inventario) y reciben
gratis un dataset limpio, estandarizado y un dashboard. Si quieren, pueden
compartir una versión anonimizada y agregada de esos datos, que se publica en
un catálogo donde otros usuarios (proveedores, emprendedores, otros negocios)
pueden comprarla. El negocio recibe un porcentaje de cada venta.

Nuestro valor agregado es parametrizar y organizar los datos: convertir un CSV
desordenado en un dataset confiable con un puntaje de calidad.

Es un proyecto académico (reto de Prompt Engineering). Los pagos, usuarios
compradores y ganancias son SIMULADOS. La limpieza de datos, el puntaje de
calidad, el dashboard y los filtros deben FUNCIONAR de verdad.

# USUARIOS
1. VENDEDOR: dueño de un negocio. Poca experiencia técnica. Quiere ordenar sus
   datos y, opcionalmente, ganar dinero con ellos. Usa sobre todo el celular.
2. COMPRADOR: proveedor/distribuidor, emprendedor o negocio que quiere
   comparar su desempeño con su sector. Busca datasets confiables y claros.

# FUNCIONALIDADES (por prioridad)

## Imprescindibles
1. Registro e inicio de sesión simulados, con elección de rol (vendedor o
   comprador). Guardar la sesión en localStorage.
2. Subida de archivo CSV (arrastrar y soltar o botón) con vista previa de las
   primeras 10 filas.
3. Mapeo de columnas: detectar las columnas del CSV y proponer a qué columna
   estándar corresponden (ej. "fecha vta" -> "fecha_venta"). El usuario puede
   confirmar o corregir.
   Columnas estándar de ventas: fecha_venta, producto, categoria, cantidad,
   precio_unitario, total, ciudad.
4. Limpieza automática: normalizar formatos de fecha a AAAA-MM-DD, quitar
   espacios y unificar mayúsculas/minúsculas en textos, convertir números
   escritos con coma o símbolo $ a número, eliminar filas duplicadas y marcar
   o quitar filas vacías. Mostrar una vista de ANTES y DESPUÉS, y un resumen
   de cuántos cambios se hicieron.
5. Puntaje de calidad de 0 a 100, calculado con: completitud (% de celdas no
   vacías), duplicados, consistencia de formatos y valores atípicos. Mostrar
   el desglose de cada componente.
6. Dashboard con 4 gráficas: ventas por mes, ventas por categoría, top 5
   productos y total de ventas con promedio por transacción.
7. Flujo de publicación: (a) anonimizar y agregar los datos (ejemplo: ventas
   por mes y categoría, nunca transacciones individuales), (b) vista previa de
   exactamente lo que se compartiría, (c) casilla de consentimiento explícito
   con texto claro, (d) botón de publicar. Solo se puede publicar si el
   puntaje es 70 o más.
8. Catálogo de datasets con tarjetas, filtros por sector, ciudad y periodo,
   y ordenamiento por puntaje o precio.
9. Detalle del dataset: descripción, muestra de datos, puntaje de calidad con
   desglose, precio y botón de compra simulada.
10. Compra simulada: confirmación y descarga del dataset en CSV.

## Extras (solo si el resto ya funciona)
- Panel del vendedor: mis datasets, estado (borrador, publicado, retirado),
  ganancias simuladas y botón para retirar un dataset.
- Panel del comprador: historial de compras.
- Comparación "mi negocio vs. el promedio del sector".

# REGLAS DE NEGOCIO
- Los datos crudos nunca se publican; solo datos agregados y anonimizados.
- El vendedor puede retirar un dataset publicado en cualquier momento.
- Precio sugerido = precio base x factor de tamaño x factor de calidad x
  factor de actualidad x factor de escasez del sector. Mostrar la fórmula en
  el detalle del dataset para que sea transparente.
- El vendedor recibe el 70 % de cada venta simulada.
- Si el usuario sube datos con información personal (nombres, cédulas,
  teléfonos, correos), detectarla y eliminarla o enmascararla en el paso de
  anonimización.

# FLUJO DEL USUARIO
Vendedor: Inicio -> Registro -> Subir CSV -> Mapeo -> Limpieza (antes/después)
-> Puntaje y dashboard -> (opcional) Publicar -> Panel.
Comprador: Inicio -> Registro -> Catálogo -> Filtros -> Detalle -> Compra
simulada -> Descarga.

# PÁGINAS
1. index.html: propuesta de valor, cómo funciona en 3 pasos y dos botones
   ("Quiero ordenar y vender mis datos" / "Quiero comprar datos").
2. registro.html: registro e inicio de sesión.
3. subir.html: carga, vista previa, mapeo y limpieza (antes/después).
4. dashboard.html: puntaje de calidad y gráficas.
5. publicar.html: anonimización, consentimiento y vista previa.
6. catalogo.html: tarjetas con filtros.
7. dataset.html: detalle y compra simulada.
8. panel.html: panel del vendedor o comprador según el rol.

# DISEÑO
- Estilo: moderno, limpio y que transmita confianza (más fintech que juego).
- Paleta: [PEGAR AQUÍ LOS 5 COLORES EN HEX]. Si aún no tenemos, propón una
  paleta con azul profundo, verde de acento y neutros claros, y defínela como
  variables CSS en :root.
- Tipografía: una fuente sans-serif legible de Google Fonts para títulos y otra
  para texto.
- Componentes: tarjetas con bordes redondeados y sombra suave, botones claros,
  barras de progreso para el puntaje, tablas legibles, insignias de estado.
- Diseño responsive con prioridad en celular (mobile first). Navegación simple.
- Referencia visual: [DESCRIBIR O ADJUNTAR IMAGEN]. Toma de ella SOLO
  [colores / distribución / tipografía / componentes]. No copies identidades
  ni logos de otras marcas; crea una propuesta propia.
- Accesibilidad básica: buen contraste, textos alternativos, etiquetas en
  formularios.

# REGLAS TÉCNICAS
- Solo HTML, CSS y JavaScript puro (sin frameworks, sin backend).
- Puedes usar por CDN únicamente: PapaParse (leer CSV) y Chart.js (gráficas).
- Archivos separados: css/estilos.css, js/ con un archivo por módulo
  (auth.js, csv.js, limpieza.js, calidad.js, dashboard.js, catalogo.js,
  compra.js), y data/datasets.json.
- Persistencia con localStorage (sesión, datasets subidos, compras).
- Todo el texto de la interfaz en español.
- Comenta el código en español, con nombres de variables y funciones claros.
- Maneja errores: archivo que no es CSV, archivo vacío, columnas sin mapear.
- Muestra mensajes amigables al usuario, no errores técnicos.

# DATOS DE EJEMPLO
- Crea data/datasets.json con 10 datasets ficticios para el catálogo
  (tiendas de barrio y restaurantes de Medellín: comunas, meses distintos,
  puntajes entre 72 y 98, precios entre 20.000 y 150.000 COP).
- Crea ejemplos/ventas_desordenado.csv con 80 filas intencionalmente sucias:
  fechas en 3 formatos, espacios extra, mayúsculas mezcladas, precios con "$"
  y comas, 5 duplicados y algunas celdas vacías. Sirve para demostrar la
  limpieza.

# LO QUE NO DEBES HACER
- No implementar pagos reales ni conexión a servicios externos.
- No inventar funciones que no estén en este prompt.
- No usar librerías pesadas ni frameworks.
- No copiar el diseño, nombre o logo de ninguna marca.
- No publicar nunca datos crudos ni información personal.

# FORMA DE TRABAJO
1. Antes de escribir código, resume en 5 líneas lo que entendiste y hazme
   máximo 3 preguntas si algo es ambiguo.
2. Construye por fases y espera mi confirmación entre ellas:
   Fase 1: estructura, estilos y navegación.
   Fase 2: subida, mapeo, limpieza y puntaje.
   Fase 3: dashboard.
   Fase 4: publicación y catálogo.
   Fase 5: compra simulada y panel.
3. En cada fase, explica brevemente qué hiciste y cómo probarlo.

# FORMATO DE SALIDA
Entrega la estructura de carpetas primero y luego cada archivo completo, con
su ruta como encabezado.
```

---

## v1.1: nombre y paleta definitivos

Estos valores reemplazan los campos entre corchetes del prompt anterior.

```
[NOMBRE DE LA PLATAFORMA] -> Datum

Paleta: #0B0B0C (negro tinta), #FAFAF7 (blanco hueso), #E8E6E1 (gris claro),
#6B6B6B (gris medio), #C8FF3D (verde lima, único acento, usar solo sobre
negro o con texto negro). Definirlas como variables CSS en :root.

Referencia visual: estilo minimalista en blanco y negro, mucho espacio en
blanco, tipografía grande, tarjetas con bordes finos y sin sombras fuertes.
Toma SOLO la distribución limpia y la jerarquía tipográfica. No copies
identidades de otras marcas.

Tipografía: Space Grotesk (títulos) e Inter (texto), desde Google Fonts.
```
