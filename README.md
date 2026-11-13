# Datum

**Tus datos, en orden. Y si quieres, con valor.**

Datum limpia y organiza gratis los datos de tu negocio y, si quieres, los vende de forma anónima a quienes los necesitan.

> Proyecto del reto de Prompt Engineering entre clanes · Riwi
> Célula: [nombre de la célula] · Clan: [nombre del clan]

---

## El problema

Los pequeños negocios de Medellín (tiendas de barrio, restaurantes, cafés y panaderías) generan datos de ventas e inventario todos los días, pero suelen tenerlos desordenados, en formatos distintos y sin saber qué valor tienen.

## La solución

1. **El negocio sube su archivo CSV**, aunque esté sucio.
2. **Datum lo limpia y lo estandariza**: unifica fechas, textos y números, y quita duplicados. Muestra el antes y el después.
3. **Recibe un puntaje de calidad (0 a 100)** y un tablero con sus ventas por mes, por categoría y sus productos más vendidos.
4. **Si quiere, publica una versión anonimizada y agregada** en un catálogo, con su consentimiento explícito. Nunca se publican datos crudos ni personales.
5. **Los compradores** (proveedores, emprendedores y otros negocios) exploran el catálogo, ven la calidad y el precio, y compran. El negocio recibe el 70 % de cada venta.

**Idea clave:** primero le servimos al vendedor y después monetizamos. El negocio recibe valor desde el primer minuto, aunque nunca venda nada.

## Funcionalidades

| Módulo | Qué hace |
|---|---|
| Registro e inicio de sesión | Cuentas con rol de vendedor o comprador |
| Subida de CSV | Vista previa y mapeo de columnas |
| Limpieza | Normaliza fechas, textos y números; quita duplicados; vista antes y después |
| Puntaje de calidad | Completitud, duplicados, formatos y valores atípicos |
| Tablero | Ventas por mes y por categoría, productos top, comparación con el sector |
| Publicación | Anonimización, vista previa y consentimiento; solo con puntaje de 70 o más |
| Catálogo: Datasets | Tarjetas con filtros por sector, zona, periodo, puntaje y precio; búsqueda, orden e insignia Verificado |
| Catálogo: Mapa de zonas | Las 16 comunas y los 5 corregimientos con 4 capas, tooltip y detalle por zona |
| Catálogo: Oportunidades | Índice Demanda − Saturación, top 5, ranking por tipo de negocio y comparador de zonas |
| Compra y descarga | Precio con fórmula transparente y descarga del dataset en CSV |
| Mi panel (básico) | El vendedor ve sus datasets, ventas y ganancias; el comprador ve y descarga sus compras |

## Privacidad

- Solo se publican datos agregados y anonimizados, y con consentimiento.
- El archivo original se procesa en el navegador de quien lo sube; no se envía a ningún servidor.
- Las zonas con menos de 5 negocios (Palmitas, Altavista y Santa Elena en los datos de ejemplo) no muestran valores ni gráficas.
- Los datos del catálogo y del mapa son **ilustrativos**, no reales.

## Estado del proyecto

| Parte | Estado |
|---|---|
| v1: subida, limpieza, puntaje, tablero, publicación y compra | Hecho |
| v2: catálogo, mapa de zonas, detalle de zona y oportunidades (Fases A a D) | Hecho |
| v3: beneficios para el vendedor en Mi panel | Prompt escrito, **no ejecutado** (hoja de ruta) |
| Integración final y revisión (privacidad, diseño, celular) | Pendiente |

Lovable se detuvo al iniciar Mi panel, así que el proyecto quedó hasta la Fase D.

**Versión que se presenta:** [elegir una]
- Proyecto 1: cuentas y datos guardados solo en el navegador.
- Proyecto 2: Lovable Cloud, con cuentas reales.

## Cómo se construyó: Prompt Engineering

Este proyecto se construyó con ayuda de IA a partir de prompts escritos y mejorados por la célula.

- **Claude:** para aclarar la idea, definir requisitos y redactar los prompts.
- **Lovable:** para generar la aplicación a partir de los prompts.
- **Coolors:** para la paleta de colores.

| Versión | Archivo | Qué pide |
|---|---|---|
| v1 | [`prompts/prompt_v1.md`](prompts/prompt_v1.md) | Prompt base: subida, limpieza, puntaje, tablero y compra (incluye nombre y paleta) |
| v2 | [`prompts/prompt_v2_catalogo.md`](prompts/prompt_v2_catalogo.md) | Catálogo con mapa de zonas y oportunidades |
| v3 | [`prompts/prompt_v3_beneficios.md`](prompts/prompt_v3_beneficios.md) | Beneficios para quienes suben datos |

Lo que falló en cada versión y cómo se ajustó el prompt está en la [bitácora de pruebas](prompts/bitacora_de_pruebas.md).

## Diseño

- **Estilo:** minimalista en blanco y negro, con un solo acento.
- **Paleta:** `#0B0B0C` negro tinta · `#FAFAF7` blanco hueso · `#E8E6E1` gris claro · `#6B6B6B` gris medio · `#C8FF3D` verde lima (solo sobre negro o con texto negro).
- **Tipografías:** Space Grotesk (títulos) e Inter (texto).

## Cómo probarlo

1. Abre la aplicación: [enlace a la demo]
2. Regístrate como **vendedor** y sube el archivo de ejemplo sucio de la app.
3. Revisa la limpieza (antes y después), el puntaje y el tablero.
4. Publica el dataset anonimizado.
5. Cierra sesión y regístrate como **comprador**.
6. En el catálogo, explora el mapa de zonas, el detalle de una zona y las oportunidades.
7. Usa **Ver datasets de esta zona** y comprueba que el filtro se aplica.
8. Compra el dataset y descarga el CSV.

## Limitaciones y próximos pasos

- Los pagos son **simulados**; no hay cobro real.
- Los compradores como mercado son una **hipótesis**: falta validarla entrevistando a proveedores y emprendedores.
- Falta ejecutar el prompt v3 (Mi panel): comparación con la zona, informe mensual, mapa de calor por hora, alertas de inventario, niveles y calculadora de ganancias.
- Falta la integración final y la revisión completa de privacidad, regla del lima y celular.
- Falta probar el registro con correo real y con Google.
- A futuro: verificación legal de la Ley 1581 de 2012, valoración de datasets y perfil de salud del negocio para acceso a créditos.

## Equipo

| Integrante | Rol |
|---|---|
| [Nombre] | Prompts y bitácora |
| [Nombre] | Pruebas y reporte de fallos |
| [Nombre] | Repositorio y commits |
| [Nombre] | Presentación |

## Estructura del repositorio

```
datum/
├── README.md
├── .gitignore
├── prompts/       prompts v1, v2, v3 y bitácora de pruebas
├── docs/          guion de presentación, commits y capturas
└── (código de la aplicación generado con Lovable)
```
