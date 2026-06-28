# Dashboard actual y seccion Libertad

## Decision

Libertad OS separara el estado financiero presente del objetivo de libertad financiera. El dashboard priorizara patrimonio neto, capital invertido, margen mensual y actividad confirmada reciente. La seccion avanzada visible como `Palancas` pasara a llamarse `Libertad` y reunira el numero objetivo, su progreso y las palancas que lo explican.

## Alcance

### Incluido

- Quitar del bloque principal del dashboard el numero de libertad, la distancia a la meta, el plazo estimado y el progreso detallado.
- Dar maxima jerarquia al patrimonio actual dentro del dashboard.
- Mantener visibles capital de inversiones, margen mensual, proximos pasos y ultimos movimientos confirmados.
- Conservar en el dashboard una referencia compacta al progreso hacia libertad con acceso directo a la seccion dedicada.
- Renombrar la etiqueta de navegacion `Palancas` a `Libertad`.
- Mover el bloque completo del objetivo de libertad al comienzo de esa seccion, antes del analisis de palancas existente.
- Actualizar las regresiones de navegacion y `CHANGELOG.md`.

### Excluido

- Cambios en formulas financieras, fuentes de datos o persistencia.
- Nuevas tablas, migraciones de Supabase o dependencias.
- Nuevas metricas historicas o snapshots de patrimonio.
- Cambios en la confirmacion de notas o en la forma de calcular el patrimonio efectivo.
- Redisenar otras secciones.

## Estructura de interfaz

### Dashboard

El primer bloque operativo mantendra la composicion actual de contenido principal mas panel lateral:

- El contenido principal abrira con `Patrimonio actual` como cifra dominante.
- Debajo mostrara capital de inversiones y margen mensual como lecturas secundarias.
- Una franja compacta mostrara el porcentaje hacia libertad o el estado `Sin calcular`, junto con una accion `Ver plan de libertad`.
- El panel lateral conservara `Proximos pasos`, movimientos confirmados, margen mensual y sus acciones.
- `Ultimos movimientos` permanecera como bloque propio inmediatamente despues, usando solo transacciones confirmadas y conservando el estado vacio actual.

La referencia compacta no repetira el numero objetivo, la distancia, el gasto anual ni el plazo. Su funcion sera orientar y enlazar, no dominar la lectura del presente.

### Seccion Libertad

La navegacion avanzada mostrara `Libertad` en lugar de `Palancas`. Se mantendra el identificador interno `palancas` para conservar hashes y enlaces existentes.

La vista comenzara con el bloque completo hoy ubicado en el dashboard:

- Numero de libertad financiera.
- Distancia restante.
- Porcentaje y barra de progreso.
- Gasto anual.
- Tiempo estimado.
- Capital usado para medir el progreso.

Debajo permanecera el panel de palancas FIRE existente. Asi, la seccion explica tanto el destino como las variables confirmadas que pueden acercarlo o alejarlo.

## Datos y comportamiento

La implementacion reutilizara `effectiveInputs`, `metrics`, `hasFreedomTarget`, `hasProgressCalculation` y `yearsLabel`. No se duplicaran calculos ni se alterara `freedomNumber` o `freedomProgressMetrics`.

El dashboard seguira consumiendo unicamente datos base y movimientos confirmados segun las reglas actuales. La referencia a libertad sera informativa y no creara, confirmara ni modificara registros. Su boton solo cambiara la seccion activa mediante el flujo de navegacion existente.

## Estados y accesibilidad

- Sin gasto mensual: la seccion Libertad mostrara los estados vacios actuales y el dashboard indicara `Sin calcular`.
- Sin movimientos confirmados: se conservara el estado vacio y la explicacion de confirmacion manual.
- Cuenta nueva: se mantendra el onboarding actual para cargar datos base o capturar una nota.
- Los botones conservaran foco visible, altura tactil y estilos de interaccion existentes.
- La barra detallada mantendra sus atributos de `progressbar`; la referencia compacta no dependera solo del color.
- El orden responsive seguira siendo patrimonio, proximos pasos, referencia a libertad y actividad reciente de manera legible en mobile.

## Verificacion

- Actualizar la regresion de navegacion para exigir la etiqueta `Libertad` y mantener el modulo interno compatible.
- Agregar una comprobacion estructural de que el bloque detallado del objetivo se renderiza bajo `activeSection === "palancas"` y que el dashboard contiene el acceso compacto.
- Ejecutar la regresion de navegacion y las regresiones financieras existentes relacionadas con progreso y palancas.
- Ejecutar lint sobre los archivos tocados o el chequeo mas estrecho disponible.
- Revisar el diff para confirmar que no cambian formulas, persistencia ni datos del usuario.

## Criterios de aceptacion

- El patrimonio actual es la cifra principal del dashboard.
- El dashboard muestra capital invertido, margen mensual y actividad reciente confirmada.
- El numero de libertad y su detalle completo ya no dominan el dashboard.
- Existe un acceso compacto y claro desde el dashboard hacia la seccion Libertad.
- La navegacion avanzada muestra `Libertad`.
- La seccion Libertad contiene el objetivo completo y el panel de palancas actual.
- Las formulas y los resultados financieros no cambian.
- Los estados vacios, la navegacion por hash y el comportamiento responsive siguen funcionando.
