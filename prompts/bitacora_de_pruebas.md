# Bitácora de pruebas: fallos y correcciones

Registro de lo que falló o se desvió al llevar cada prompt a Lovable (9 de noviembre de 2026) y de cómo se ajustó. Todo sale de los reportes de la herramienta.

La columna **Commit** se completa con el repositorio. Las fechas de los commits no se modifican.

## Resumen por versión

| Versión | Prompt | Estado |
|---|---|---|
| v1 | [`prompt_v1.md`](prompt_v1.md) | Ejecutada en Lovable |
| v2 | [`prompt_v2_catalogo.md`](prompt_v2_catalogo.md) | Ejecutada hasta la Fase D |
| v3 | [`prompt_v3_beneficios.md`](prompt_v3_beneficios.md) | Escrita, no ejecutada |

## Dos proyectos en Lovable

El trabajo quedó en dos proyectos de Lovable que llegaron hasta el mismo punto (Fase D terminada, Mi panel sin hacer):

| Proyecto | Dónde se guardan cuentas y datos | Cómo terminó |
|---|---|---|
| Proyecto 1 (`lovable-project-0f219255`) | Solo en el navegador de cada visitante | Pausado después de la Fase D |
| Proyecto 2 (`lovable-project-2`) | Lovable Cloud, con cuentas reales | Terminó la Fase D y siguió con Mi panel, sin reporte posterior |

Antes de presentar hay que elegir cuál se muestra y dejarlo escrito en el README.

---

## v1: prompt base

### Fallos y correcciones

| Fallo o desvío | Qué pasó | Corrección para el prompt |
|---|---|---|
| Preguntas sin resolver | Lovable preguntó si parar al final de cada fase, qué precio base usar y cómo unificar mayúsculas. Se eligió seguir todo seguido, que la herramienta propusiera el precio base y dejar todo en minúsculas. | Definir en el prompt el modo de entrega, el precio base y la regla de mayúsculas. |
| Tecnología distinta | El prompt pedía HTML, CSS y JavaScript puro, pero la plataforma no entrega archivos .html sueltos. Construyó las 8 páginas con su propia herramienta, con un módulo por tema. | Decidir antes si se acepta el stack de la herramienta o se usa otra que genere HTML puro. |
| Páginas faltantes | Al migrar el zip, los enlaces a Catálogo, Tablero y Mi panel no tenían página. Lovable las construyó. | Listar las páginas obligatorias y pedir que no queden enlaces rotos. |
| Dónde se guardan los datos | Lovable preguntó si mantener cuentas, cargas y compras solo en el navegador o pasarlas a la nube. En el proyecto 1 se eligió solo navegador. | Escribir en el prompt dónde se guarda cada dato. |
| Errores pequeños de código | Lovable corrigió errores menores que venían en el zip y probó el flujo completo: un vendedor publica, un comprador compra y descarga. | Mantener la instrucción de explicar cómo probar cada fase. |

### v1.1: nombre y paleta

| Fallo o desvío | Qué pasó | Corrección |
|---|---|---|
| Regla del lima incumplida | Las barras de calidad incumplían la regla (lima solo sobre negro o con texto negro). | Lovable las pasó a negro, también las de productos top del Tablero. |

---

## v2: catálogo, mapa de zonas y oportunidades

| Fase | Qué falló o se desvió | Ajuste | Commit |
|---|---|---|---|
| A: pestaña Datasets | El archivo de ventas no tenía columna de hora y no estaba definido el formato del inventario. | Se pidió agregar `fecha_hora` a ventas y un archivo de inventario aparte (`producto`, `stock_actual`, `stock_minimo`). Café y Panadería se sumaron al registro. | |
| A: gráficas | El prompt pedía Chart.js, pero la app ya usaba otra librería de gráficas. | Lovable usó la librería que ya tenía, con el mismo resultado visual. | |
| B: mapa de zonas | Mapa con hexágonos en lugar de polígonos, y el prompt no fijaba los pesos del índice de oportunidad. | Lovable definió 60 % afluencia y 40 % ventas promedio, menos la saturación relativa. Cada zona muestra su valor en número para no depender del color. | |
| B: privacidad | Palmitas, Altavista y Santa Elena tienen menos de 5 negocios. | Salen rayadas, en gris, con el aviso de privacidad y sin valores. | |
| C: detalle de zona | Sin fallos reportados por la herramienta. | Panel con afluencia por día, horas pico, tipos de negocio, tipos de restaurante y ventas de 6 meses con crecimiento. El botón Ver datasets de esta zona aplica el filtro. En celular sale como panel deslizable. | |
| D: oportunidades | Sin fallos reportados por la herramienta. | Fórmula explicada con ejemplo, top 5 con 3 razones, selector por tipo de negocio, comparador de zonas y aviso de no es asesoría financiera. | |
| D: coherencia entre pestañas | Era un pendiente del plan de integración. | La zona y el sector se mantienen al cambiar de pestaña y al ir a un dataset y volver (reporte del proyecto 1). | |

### Migración a Lovable Cloud (proyecto 2)

| Qué cambió | Detalle | Commit |
|---|---|---|
| Cuentas reales | Contradice la v1, que pedía registro simulado. Ahora hay registro con correo y contraseña, y opciones de Google y Lovable. | |
| Datos pagados protegidos | Cualquiera ve una vista previa de 8 filas; solo el dueño o quien compró descarga el archivo completo. | |
| Compras validadas | El servidor valida precios y el 70 % del vendedor. | |
| Privacidad | El archivo original nunca sale del navegador; solo se guardan las filas limpias. | |
| Cuentas anteriores | No se pudieron migrar porque solo existían en el navegador de cada persona. | |

---

## v3: beneficios para quienes suben datos

| Estado | Detalle | Commit |
|---|---|---|
| No ejecutada | Lovable se detuvo al iniciar Mi panel. Se presenta como hoja de ruta. | |

Mi panel básico sí existe desde la v1: el vendedor ve sus datasets, ventas y ganancias del 70 %, y puede retirar o volver a publicar; el comprador ve y descarga sus compras. Los 11 beneficios de la v3 no se construyeron.

---

## Lecciones para el prompt

- Fijar fórmulas y pesos (índice de oportunidad, precio base) para que la herramienta no los invente.
- Definir desde la v1 todas las columnas que usará el panel, como `fecha_hora` y el inventario.
- Decidir el stack y dónde se guardan los datos antes de empezar.
- Pedir al final de cada fase una lista de qué probar.
- Revisar las reglas de diseño, como el lima, en todas las pantallas y no solo en la primera.

## Lo que quedó sin hacer

- Ejecutar el prompt v3 (Mi panel): comparación con la zona, informe mensual, mapa de calor por hora, alertas de inventario, niveles y calculadora de ganancias.
- Integración final del flujo completo y revisión de privacidad, regla del lima, aviso de datos ilustrativos, escritorio y celular, y botones sin acción.
- Probar el registro con un correo real y con Google (las pruebas de Lovable no pudieron).
- Anotar el commit de cada ajuste en las tablas de arriba.

## Qué probar en cada versión

- ¿La limpieza funciona con el archivo de ejemplo sucio?
- ¿El puntaje cambia si se ensucia el archivo?
- ¿No deja publicar con puntaje menor a 70?
- ¿Las zonas con menos de 5 negocios se ven en gris y sin gráficas?
- ¿Los filtros y la zona se mantienen al cambiar de pestaña?
- ¿Se ve bien en el celular?
