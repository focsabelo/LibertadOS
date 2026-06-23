# v2.1.0 Reglas de Aumentos e Ingresos Extra Design

## Objetivo

Convertir los aumentos de ingreso y cobros extra confirmados en una lectura accionable antes de que el nuevo dinero se absorba como gasto fijo o consumo automatico.

## Alcance

El modulo reutiliza transacciones confirmadas existentes. No crea movimientos reales, no interpreta intenciones como ingresos y no modifica dashboard, patrimonio, cartera, deuda ni roadmap sin confirmacion manual.

Incluye:

* aumento de ingreso confirmado contra el mes anterior;
* regla editable de distribucion 70/20/10;
* aumento absorbido por gasto confirmado;
* impacto potencial sobre roadmap si el tramo de inversion se ejecutara;
* accion principal sobria.

Queda fuera:

* persistencia nueva en Supabase;
* confirmacion automatica de inversiones, ahorros o gastos;
* recomendaciones deterministas de inversion;
* parser nuevo para promesas futuras.

## Modelo

Agregar un analizador puro en `src/lib/finance.ts`:

* `IncomeIncreaseRuleSettings`: porcentajes de inversion, mejora de vida y gusto personal.
* `IncomeIncreaseAnalysis`: detecta monto incremental, regla aplicada, gasto absorbido, margen capturado, impacto FIRE y meses estimados de adelanto/retraso en roadmap.
* `normalizeIncomeIncreaseRuleSettings`: asegura que la regla sea usable y vuelva a 70/20/10 si los porcentajes son invalidos.

La fuente de datos sera `LifestyleInflationAnalysis`, porque ya filtra solo movimientos reales y compara mes actual contra mes anterior. Esto evita duplicar reglas de confirmacion.

## UI

Agregar una vista dedicada `Aumentos` en navegacion avanzada. La pantalla sera densa y operativa:

* resumen del aumento detectado;
* distribucion 70/20/10 editable localmente;
* lectura de gasto absorbido;
* impacto simulado sobre libertad y roadmap;
* una accion principal.

Si no hay aumento confirmado, mostrar estado vacio practico: confirmar ingresos reales en Notas y revisar gastos antes de sacar conclusiones.

## Datos y Seguridad

La regla editable se mantiene en estado local del dashboard en esta primera version. No se agrega tabla ni migracion. La app puede mostrar sugerencias, pero cada movimiento real debe seguir pasando por captura, deteccion y confirmacion manual.

## Testing

Agregar tests de regresion en `tests/parser-regression.ts` para:

* regla por defecto 70/20/10;
* normalizacion de porcentajes invalidos;
* aumento confirmado con gasto absorbido;
* ausencia de aumento cuando no hay comparacion o el ingreso no sube;
* impacto roadmap simulado sin modificar datos reales.

## Criterio de cierre

`npm run test:parser`, `npm run lint` y `npm run build` pasan. `CHANGELOG.md` y `ROADMAP.md` reflejan `v2.1.0` como cerrado.
