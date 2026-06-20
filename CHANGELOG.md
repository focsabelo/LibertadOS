# CHANGELOG

## v2.0.1 - Estabilidad de confirmacion de notas

* Confirmacion de notas movida a una operacion Supabase atomica: nota y transacciones se guardan juntas o no se confirma nada.
* El dashboard ya no se actualiza con transacciones confirmadas hasta que la persistencia termina correctamente.
* Edicion de notas ya confirmadas limpia transacciones persistidas y marca reconfirmacion pendiente en una operacion atomica.
* Error accionable cuando Supabase no puede confirmar o guardar la reconfirmacion.

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

## v1.4.0 - Detector de Inflacion del Estilo de Vida

* Panel de inflacion del estilo de vida en el dashboard.
* Comparacion de ingresos, gastos, ahorro estimado y tasa de ahorro contra el mes anterior.
* Riesgo bajo, medio, alto o sin datos usando solo transacciones confirmadas.
* Calculo del porcentaje del aumento de ingreso absorbido por nuevos gastos.
* Senales para gasto que acompana ingresos, caida de tasa de ahorro, compras grandes recientes y gastos criticos.
* Recomendaciones conectadas con Palancas FIRE, regla 70/20/10, colchon 5%, compras grandes y vivienda/transporte/comida.
* Tests de la logica de inflacion del estilo de vida, incluyendo intenciones y sugerencias no confirmadas fuera del conteo real.

## v1.5.0 - Deuda Real / TAE

* Modelo minimo `DebtAnalysis` para deuda real, compras en cuotas, tarjeta, prestamos, hipotecas, auto y pago minimo.
* Calculo de cuota mensual, costo total, intereses, costo anual, TAE estimada, impacto FIRE y presion sobre margen mensual.
* Parser ampliado para distinguir deuda real, intencion, negacion, gasto con tarjeta, compra en cuotas, financiacion y pago minimo.
* "12 cuotas de 200" aislado queda como analisis potencial y no se puede confirmar sin verbo real.
* Tarjeta de credito no asume cuotas ni intereses si no hay datos explicitos.
* Bloque "Costo real de deuda" en datos detectados, con campos faltantes visibles.
* Panel "Carga de deuda confirmada" en el dashboard usando solo movimientos confirmados.
* Prevencion de doble conteo: el dashboard mensual/FIRE usa cuota mensual cuando existe, y costo total queda separado.
* Tests de parser y carga de deuda para intenciones, negaciones, cuotas, tarjeta, hipoteca, auto y prestamos.

## v1.6.0 - Cartera Objetivo

* Panel de cartera objetivo en el dashboard.
* Clases de activo: ETF USA, ETF Europa, Emergentes, Oro, Bitcoin y Bienes raices.
* Objetivos editables con advertencia cuando no suman 100%.
* Montos actuales manuales o derivados de inversiones confirmadas compatibles.
* Desbalance absoluto, desbalance porcentual y estado por clase: sobrepeso, bajo peso o alineado.
* Inversiones no confirmadas, intenciones, pensamientos, negaciones y simulaciones fuera de la cartera actual.
* Visualizacion sobria de objetivo vs actual sin recomendacion financiera.

## v1.6.1 - Navegacion y Captura Premium

* Navegacion interna por secciones: Dashboard, Notas, Decisiones, Cartera, Deuda, Roadmap, Macro y Config.
* Dashboard convertido en vista principal resumida con atencion actual y accion semanal.
* Notas, cartera, deuda y configuracion separadas como vistas dedicadas.
* Pantallas reservadas para decisiones, roadmap y macro sin mezclar datos reales con simulaciones.
* Vista de notas ampliada con editor de captura mas alto y estructura lateral mas espaciosa.
* Correccion de IDs duplicados al navegar por hash entre secciones.
* Verificacion visual desktop/mobile sin overflow horizontal.

## v1.7.0 - Roadmap Patrimonial

* Modelo `WealthMilestone` para hitos patrimoniales basados en capital invertido o patrimonio neto.
* Calculo de progreso, distancia en dolares, porcentaje completado y meses estimados por hito.
* Separacion entre progreso real y simulacion de mayor aporte mensual.
* Hitos iniciales: US$50.000 invertidos, primer inmueble, 5 propiedades, US$500.000, retiro parcial 5% anual y US$1.000.000.
* Pantalla dedicada de Roadmap con proximo hito prioritario, lista de hitos y supuesto editable de aporte simulado.
* Impacto de gastos confirmados expresado como retraso aproximado en meses sobre el hito.
* Tests de calculo para siguiente hito, hitos alcanzados y simulacion de mayor aporte.

## v1.8.0 - Persistencia Segura Supabase

* Autenticacion simple con Supabase Auth antes de mostrar datos privados.
* Persistencia Supabase para datos base, cartera objetivo, Bot Opera24hs, reglas, notas y transacciones confirmadas.
* Migracion SQL con RLS por usuario y `updated_at` automatico.
* Convencion Next `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` para la anon key publica.
* Confirmacion manual preservada: los datos detectados en notas no crean transacciones hasta confirmar.

## v1.8.1 - Auth y Persistencia Privada

* Acceso al dashboard y notas bloqueado por sesion real de Supabase Auth.
* Se evita guardar automaticamente datos default de dashboard, cartera y bot al cargar una cuenta vacia.
* Se evita crear una nota vacia en Supabase solo por abrir el modulo de notas.

## v1.9.0 - Gastos Fijos Mensuales

* Seccion "Gastos fijos mensuales" dentro de Configuracion.
* Captura en texto simple con conversion a registros estructurados editables.
* CRUD Supabase para crear, editar, eliminar y activar/desactivar gastos fijos por usuario.
* Total mensual informativo de gastos activos, separado de las formulas del dashboard.
* Migracion `fixed_monthly_expenses` con RLS por usuario.

## v1.9.1 - Estabilidad de Gastos Fijos

* Los eventos de refresco de sesion de Supabase ya no vacian la lista de gastos fijos al cambiar de pestana del navegador.
* Regresion automatizada para preservar datos privados en memoria cuando el usuario autenticado no cambia.

## v1.9.2 - Configuracion Operativa

* Configuracion usa una cabecera compacta sin repetir el hero principal.
* Se quitaron de Configuracion las tarjetas introductorias y las metricas de atencion semanal.
* Datos base y gastos fijos mensuales quedan como el nucleo operativo de la pantalla.
* Gastos fijos siguen siendo informativos y no modifican las formulas ni el dashboard principal.

## v1.9.3 - Layout global consistente

* Header global unificado para todas las secciones, incluida Configuracion.
* Eliminadas las tarjetas informativas del header para reducir altura y ruido visual.

## v1.10.0 - Sistema Semanal de Ejecucion

* Nueva seccion Semana con checklist operativo por semana.
* Score sobrio de ejecucion semanal con estado pendiente, incompleto o cumplido.
* Recomendacion practica unica basada solo en transacciones confirmadas.
* Persistencia Supabase para reviews semanales con RLS por usuario.
* Dashboard principal muestra la accion semanal sin convertir checks en movimientos reales.
* Tests de analisis semanal y persistencia agregados al comando `npm run test:parser`.

## v2.0.0 - Margen Financiero

* Nueva seccion Margen para medir libertad mensual real.
* Calculo de margen disponible, meses de colchon, presion de deuda, tasa de ahorro y estado general.
* Gastos fijos activos conectados como supuestos separados, sin convertirlos en transacciones confirmadas.
* Separacion entre gastos esenciales, no esenciales, deuda mensual y punto de tranquilidad.
* Dashboard operativo muestra el margen mensual y prioriza la revision cuando el estado es fragil o ajustado.
* Tests de margen financiero agregados usando solo movimientos reales y descartando intenciones.

Todas las versiones verificadas con:

* npm run lint
* npm run build
* npm run test:parser
