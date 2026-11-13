# Prompt v3: beneficios para quienes suben datos (Mi panel)

**Herramienta:** Lovable
**Qué pide:** ampliar el panel del vendedor con beneficios gratuitos que den valor inmediato al negocio que sube sus datos.
**Estado:** escrito, **no ejecutado**. Lovable se detuvo al iniciar Mi panel, así que queda como hoja de ruta.

Ver el estado en [`bitacora_de_pruebas.md`](bitacora_de_pruebas.md).

---

## Prompt

```
# OBJETIVO
Ampliar panel.html (vista del vendedor) de Datum con beneficios que den valor
inmediato y gratuito al negocio que sube sus datos. Mismo estilo y paleta.

# BENEFICIOS A IMPLEMENTAR

1. "Mi negocio vs. mi zona": comparación anónima con el promedio de su comuna
   y su sector (ventas, ticket promedio, producto estrella). Mensajes como
   "Vendes 12 % más que el promedio de tiendas en Belén".

2. "Informe mensual automático": resumen con ventas del mes, cambio frente
   al mes anterior, mejor día y hora, y 3 recomendaciones. Botón para
   descargarlo como archivo imprimible.

3. "Alertas de inventario": a partir del inventario subido, mostrar
   productos con bajo stock, productos sin rotación en 30 días y
   productos con mayor rotación sugeridos para reponer.

4. "Mejores horas y días": mapa de calor de ventas por día y hora, con
   sugerencia de promociones en horas bajas.

5. "Radar de oportunidades": 2 o 3 productos o categorías con alta demanda en
   su zona que su negocio aún no vende.

6. "Calculadora de ganancias": simulador que estima cuánto podría ganar si
   publica su dataset (usa la fórmula de precio y el 70 % del vendedor), con
   un control deslizante de ventas estimadas por mes.

7. "Niveles Datum" (gamificación): Bronce, Plata, Oro y Lima según
   constancia, puntaje de calidad y datos publicados. Muestra la barra de
   progreso y qué desbloquea cada nivel (ej. insignia "Verificado", mayor
   visibilidad en el catálogo, informe ampliado).

8. "Perfil de salud del negocio" (hoja de ruta): un puntaje de consistencia
   de ventas que en el futuro podría ayudar a acceder a créditos. Mostrarlo
   como "próximamente" con una vista de ejemplo.

9. "Quién se interesa por mis datos": cuántos compradores simulados vieron
   su dataset, de qué tipo (proveedor, emprendedor, negocio) y cuántas
   compras. Sin datos personales de los compradores.

10. "Descuentos de proveedores" (simulado): proveedores ficticios ofrecen
    beneficios a negocios con nivel Plata o superior.

11. "Control total": panel de privacidad con interruptores para decidir qué
    se comparte, botón "retirar mis datos" y registro de cuándo se publicó
    cada cosa.

# REGLAS
- Todo se calcula con los datos que el usuario subió y con data/zonas.json.
- Muestra "Datos ilustrativos" donde se usen datos ficticios.
- Los beneficios 1 al 4 y 6 deben funcionar de verdad; el resto puede ser
  simulado.
- Prioriza claridad: tarjetas con un título, un número grande y una
  explicación de una línea.
- Responsive y accesible, sin librerías nuevas.

# FORMA DE TRABAJO
Construye en este orden y confirma entre pasos: (1) comparación con la zona y
calculadora de ganancias, (2) informe mensual y mapa de calor, (3) alertas de
inventario, (4) niveles, (5) el resto.
```

---

## Datos que necesita este prompt

Estos dos datos se definieron durante la v2 y son necesarios para los beneficios 3 y 4:

- **Hora de venta:** columna `fecha_hora` en el archivo de ventas (mapa de calor y mejor hora).
- **Inventario:** archivo separado con `producto`, `stock_actual` y `stock_minimo` (alertas de stock).
