# Prompt v2: catálogo con mapa de zonas y oportunidades

**Herramienta:** Lovable
**Qué pide:** una página de catálogo con 3 pestañas (Datasets, Mapa de zonas y Oportunidades).
**Se pegó como:** dos archivos Markdown, CONTEXTO y OBJETIVO.

Lo que falló y cómo se ajustó está en [`bitacora_de_pruebas.md`](bitacora_de_pruebas.md).

---

## Prompt

```
# CONTEXTO
Continuamos el proyecto Datum (plataforma de datos para pequeños negocios de
Medellín). Mantén exactamente el mismo estilo, paleta (#0B0B0C, #FAFAF7,
#E8E6E1, #6B6B6B y el acento #C8FF3D solo sobre negro o con texto negro),
tipografías (Space Grotesk e Inter), variables CSS y estructura de archivos
del prompt anterior. Reutiliza css/estilos.css y no dupliques estilos.

# OBJETIVO
Construir catalogo.html como una página con 3 pestañas:
1. "Datasets": catálogo con filtros.
2. "Mapa de zonas": mapa interactivo de Medellín por comunas.
3. "Oportunidades": sugerencias de negocios por zona.

# PESTAÑA 1: DATASETS
- Tarjetas con: título, sector, zona (comuna), periodo, puntaje de calidad
  (barra de progreso), precio en COP, insignia "Verificado" si el puntaje
  es mayor o igual a 85, y botón "Ver detalle".
- Filtros: sector (tienda de barrio, restaurante, café, panadería), comuna,
  periodo (últimos 3, 6 o 12 meses), rango de puntaje y rango de precio.
- Búsqueda por texto y ordenamiento por puntaje, precio o más recientes.
- Contador de resultados y estado vacío amigable cuando no hay coincidencias.
- Los filtros se combinan entre sí y se actualizan en tiempo real.
- Al seleccionar una comuna en el mapa, el filtro de zona se aplica aquí.

# PESTAÑA 2: MAPA INTERACTIVO DE ZONAS
- Mapa SVG esquemático (no geográficamente exacto) de las 16 comunas y los 5
  corregimientos de Medellín, dibujado como polígonos simples con su nombre.
  Comunas: 1 Popular, 2 Santa Cruz, 3 Manrique, 4 Aranjuez, 5 Castilla,
  6 Doce de Octubre, 7 Robledo, 8 Villa Hermosa, 9 Buenos Aires,
  10 La Candelaria, 11 Laureles-Estadio, 12 La América, 13 San Javier,
  14 El Poblado, 15 Guayabal, 16 Belén. Corregimientos: Palmitas,
  San Cristóbal, Altavista, San Antonio de Prado, Santa Elena.
- Selector de "capa" que cambia el color de las zonas (escala de grises con
  el verde lima como nivel más alto):
  a) Afluencia de compradores
  b) Ventas promedio por negocio
  c) Cantidad de negocios registrados
  d) Índice de oportunidad
- Efecto hover con tooltip (nombre, valor de la capa activa) y clic para
  seleccionar la zona. Zona seleccionada resaltada con borde.
- Leyenda de colores y botón "Limpiar selección".
- Si una zona tiene menos de 5 negocios aportando datos, se muestra en gris
  con el mensaje "Datos insuficientes para proteger la privacidad" y no se
  muestran sus gráficas.
- Aviso visible: "Datos ilustrativos de demostración".

## Panel de detalle de la zona (al hacer clic)
Muestra, con Chart.js:
1. Afluencia de compradores por día de la semana (barras).
2. Horas pico de compra (línea).
3. Tipos de negocio predominantes (dona): tiendas, restaurantes, cafés,
   panaderías, otros.
4. Dentro de restaurantes, tipos más frecuentes (barras horizontales):
   comida rápida, corrientazo, parrilla, comida saludable, asadero, otros.
5. Evolución de ventas de los últimos 6 meses (línea) con el porcentaje de
   crecimiento trimestral.
6. Tarjetas resumen: negocios registrados, ticket promedio, categoría más
   vendida, hora de mayor afluencia.
7. Botón "Ver datasets de esta zona" que filtra la pestaña 1.

# PESTAÑA 3: OPORTUNIDADES
- Para cada zona, calcular un índice de oportunidad de 0 a 100 por tipo de
  negocio usando: demanda (afluencia de compradores y ventas promedio) menos
  saturación (negocios existentes de ese tipo). Mostrar la fórmula en un
  texto explicativo para que sea transparente.
- Lista "Top 5 oportunidades" con tarjetas: tipo de negocio sugerido, zona,
  índice, y 3 razones (ej. "Alta afluencia a mediodía y pocos restaurantes
  saludables").
- Selector para elegir tipo de negocio y ver las mejores zonas para abrirlo.
- Cada tarjeta lleva el aviso: "Sugerencia basada en datos ilustrativos, no
  es asesoría financiera".
- Botón "Comparar zonas": permite elegir 2 zonas y ver sus métricas lado a
  lado en una tabla.

# DATOS
Crea data/zonas.json con las 21 zonas y, para cada una: id, nombre, tipo
(comuna o corregimiento), negocios_registrados (entre 2 y 60, dejando 2 o 3
zonas por debajo de 5), indice_afluencia (0 a 100), ventas_promedio_mensual
(en COP), afluencia_por_dia (7 valores), horas_pico (por franja de 2 horas),
mix_negocios (porcentajes que sumen 100), tipos_restaurante (porcentajes que
sumen 100), ventas_ultimos_6_meses (6 valores) y crecimiento_trimestral.
Los valores deben ser realistas y variados: El Poblado y Laureles con
muchos restaurantes y ticket alto, comunas populares con alta afluencia de
tiendas de barrio, zonas con huecos de oferta que generen oportunidades.
Amplía data/datasets.json a 16 datasets asociados a esas zonas.

# REGLAS TÉCNICAS
- Solo HTML, CSS y JavaScript puro; Chart.js por CDN.
- Archivos: js/catalogo.js (filtros y tarjetas), js/mapa.js (SVG e
  interacción), js/zonas.js (cálculos de índices y gráficas) y
  data/zonas.json.
- Código comentado en español y funciones pequeñas.
- Responsive: en celular, el mapa va arriba y el panel de detalle se abre
  como panel inferior deslizable; las pestañas se pueden deslizar.
- Accesibilidad: las zonas del mapa se pueden recorrer con teclado y tienen
  etiquetas de texto; el mapa no depende solo del color.
- Maneja el caso de datos que no carguen con un mensaje amigable.

# LO QUE NO DEBES HACER
- No usar Google Maps, Mapbox ni servicios con clave de API.
- No presentar los datos como reales.
- No inventar funciones fuera de este prompt.
- No cambiar el estilo ni la paleta definidos.

# FORMA DE TRABAJO
1. Resume en 5 líneas lo que entendiste.
2. Construye por fases y espera mi confirmación entre ellas:
   Fase A: datos (zonas.json y datasets.json) y pestaña 1 funcionando.
   Fase B: mapa SVG con capas y tooltips.
   Fase C: panel de detalle con gráficas.
   Fase D: pestaña de oportunidades y comparador.
3. En cada fase explica cómo probarla.
```

---

## Instrucciones adicionales dadas durante la ejecución

Después de la Fase A, al confirmar la Fase B, se agregó esto:

```
Para la Fase C: agrega una columna fecha_hora al archivo de ventas, y el
inventario se sube en un archivo separado con producto, stock_actual,
stock_minimo.
```

Al continuar con la Fase C, se agregó este plan para integrar todo:

```
Después quiero que integres todo en una sola app que funcione de principio a
fin. Sigue este orden:
Fase D: la fórmula del índice de oportunidad y sus explicaciones.
Mi panel: con la columna fecha_hora en el archivo de ventas (para el mapa de
calor y la mejor hora) y el inventario en un archivo separado (producto,
stock_actual, stock_minimo) para las alertas de stock.
Integración del flujo completo: registro/inicio de sesión -> Catálogo
(Datasets, Mapa de zonas, Oportunidades) -> detalle de zona -> Datasets
filtrados -> compra -> Mi panel.
Coherencia entre pestañas: que los filtros, la zona seleccionada y el sector
se mantengan al cambiar de pestaña, y que el botón "Ver datasets de esta
zona" aplique el filtro.
Revisión final:
- Que la privacidad se cumpla en todas partes (zonas con menos de 5
  negocios, sin valores visibles).
- Que la regla del lime (solo sobre negro o con texto negro) se cumpla en
  todas las pantallas.
- Que el aviso "Datos ilustrativos de demostración" aparezca donde
  corresponde.
- Que funcione en escritorio y celular.
- Que no haya botones sin acción ni pestañas con "próxima fase".
Entrégame al final:
- Una lista corta de qué probar, en orden, para la demo.
- Los errores o pendientes que queden, si los hay.
Haz una fase a la vez y dime cuando termines cada una.
```
