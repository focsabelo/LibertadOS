# CHANGELOG

## v1.0.0

* Dashboard FIRE x25.
* Notas financieras.
* Parser de gastos, ingresos, inversiones y deudas.
* Confirmación manual antes de guardar movimientos.
* Separación entre notas y transacciones.

## v1.1.0

* Edición segura de notas.
* Borrado seguro de notas.
* Eliminación de transacciones asociadas.
* Prevención de datos huérfanos.
* Reconfirmación tras editar.

## v1.2.0

* Panel Palancas FIRE.
* Número FIRE derivado.
* Gasto mensual y anual.
* Categorías vivienda, transporte y comida.
* Escenarios de reducción de gasto.
* Regla 70/20/10.
* Sugerencia de colchón del 5%.

## v1.3.0

* Implementacion inicial del filtro anti-error para compras grandes, deuda, cuotas y financiacion.
* Deteccion inicial de riesgo bajo, medio y alto en decisiones financieras importantes.
* Deteccion inicial de enemigos financieros como FOMO, impulso, estatus, comparacion y consumo emocional.
* Confirmacion segura preservada: compras futuras, ideas y negaciones no se guardan como gastos reales.

## v1.3.1 - Correccion y estabilizacion

* Impacto FIRE potencial en compras futuras, intenciones y decisiones con monto.
* Negaciones sin monto clasificadas como no realizadas.
* Tests minimos del parser para cubrir gastos, ingresos, intenciones, negaciones, deuda, cuotas y enemigos financieros.
* Copy de confirmacion aclarado: los movimientos solo entran al dashboard con confirmacion.
* Ajustes mobile de touch targets en botones y controles criticos.

Todas las versiones verificadas con:

* npm run lint
* npm run build
* npm run test:parser
