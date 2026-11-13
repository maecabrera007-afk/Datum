# Roadmap

## Catálogo con 3 pestañas (brief CONTEXTO) — confirmar con el usuario entre fases
- [x] Fase A: data/zonas.json (21 zonas), datasets.json a 16, pestaña Datasets (filtros, búsqueda, orden, Verificado ≥85)
- [x] Fase B: mapa SVG esquemático con capas, tooltips, teclado, privacidad <5 negocios
- [x] Fase C: panel de detalle de zona con gráficas (panel inferior en celular)
- [ ] Fase D: pestaña Oportunidades (índice, top 5, selector por tipo, comparar zonas)

## Panel del vendedor (brief OBJETIVO) — el usuario pidió hacerlo seguido, avisando al terminar cada fase
- [ ] 1. Mi negocio vs. mi zona + calculadora de ganancias
- [ ] 2. Informe mensual imprimible + mapa de calor día/hora (necesita hora de venta en el CSV)
- [ ] 3. Alertas de inventario (necesita definir cómo se sube el inventario)
- [ ] 4. Niveles Datum
- [ ] 5. Radar, perfil de salud, quién se interesa, descuentos, control de privacidad

## Notas del usuario para el panel del vendedor
- Ventas: agregar columna estándar `fecha_hora` al CSV (para mejor hora y mapa de calor).
- Inventario: archivo CSV separado con `producto`, `stock_actual`, `stock_minimo`.

## Integración y revisión final (pedido 9 nov)
- [ ] Flujo completo: registro → catálogo (3 pestañas) → detalle de zona → datasets filtrados → compra → Mi panel
- [ ] Coherencia entre pestañas: filtros, zona y sector se mantienen; "Ver datasets de esta zona" aplica el filtro
- [ ] Revisión: privacidad <5 negocios, regla del lima, aviso "Datos ilustrativos", escritorio y celular, sin botones muertos
- [ ] Entregar lista de qué probar para la demo y pendientes
