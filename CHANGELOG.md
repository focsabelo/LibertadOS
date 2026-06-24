# CHANGELOG

## Unreleased

* Notas queda enfocada en gastos, compras grandes e ingresos extra ya ocurridos; inversiones, deudas, ahorros y decisiones dejan de aparecer como opciones guardables desde ese flujo.
* Gastos fijos interpreta `$` como UYU por defecto para reflejar el uso local en Uruguay; `USD`, `US$` y `U$S` siguen siendo dolares.
* Bot Opera24hs arranca sin capital, aportes ni meses ficticios hasta que el usuario lo configure explicitamente.
* Regresiones actualizadas para cubrir navegacion principal de Revision, moneda local en gastos fijos y defaults vacios del bot.
* Revision pasa a la navegacion principal y Avanzado queda ordenado desde Decisiones hacia Politica, Cartera, Deuda, Palancas y Roadmap.
* El patrimonio actual separa activos patrimoniales, capital de inversiones y movimientos confirmados, sin dejar que una cartera derivada borre el patrimonio no invertido.
* Patrimonio actual usa ganancia o perdida confirmada del mes, no una resta genérica de deudas confirmadas, para reflejar si ingresos superaron gastos o al reves.
* Patrimonio actual ya no resta gastos sueltos cuando no hay ingreso confirmado del mes; esos gastos quedan en Revisión/Margen hasta que exista un cierre comparable.
* Datos base renombra el ingreso mensual como `Sueldo mensual confirmado`; ese sueldo alimenta el cierre mensual y Notas queda para gastos e ingresos extra.
* El progreso hacia libertad financiera usa capital de inversiones derivado desde la cartera cuando existe, evitando editar capital invertido manualmente.
* Configuracion elimina el campo editable de patrimonio manual para evitar que datos viejos fijen el patrimonio actual.
* Configuracion suma una lista editable de activos patrimoniales con valor, deuda asociada y marca de activo productivo para calcular patrimonio y capital de inversiones.
* El patrimonio manual heredado se migra a un activo visible llamado `Patrimonio manual heredado` cuando no hay activos cargados, evitando valores ocultos como fuente del dashboard.
* La UI renombra la cartera y sus montos visibles: `Cartera de inversiones`, `Valor actual` y `Capital de inversiones`.
* Cartera de inversiones oculta el desbalance detallado de la vista principal y mantiene una lectura mas simple de actual vs objetivo.
* Notas guarda ediciones con debounce y cola para evitar descartar cambios mientras otra escritura sigue en curso.
* Los borradores cargados conservan la fecha de ultima edicion como referencia para frases relativas como "ayer".

## v2.3.4 - Estilo Sin Seccion Dedicada

* La navegacion avanzada elimina Estilo como seccion dedicada.
* La regla editable de aumentos e ingresos extra se integra dentro de Politica.
* La lectura de inflacion del estilo de vida se integra dentro de Revision.
* Los enlaces antiguos `#aumentos` redirigen a `#politica` y `#estilo` redirige a `#revision`.
* Las tarjetas de capital invertido muestran siempre un valor numerico, incluso cuando es cero.

## v2.3.3 - Palancas FIRE con Gastos Fijos

* Palancas FIRE ahora incluye gastos fijos activos en la lectura mensual, anual y x25.
* Vivienda, transporte y comida de gastos fijos activos aparecen en categorias criticas, evitando duplicar un fijo si ya existe una transaccion recurrente confirmada equivalente.
* La UI reemplaza etiquetas FIRE crudas por explicaciones breves del numero de libertad financiera.
* Las etiquetas visibles priorizan "numero de libertad financiera" y dejan x25 como formula explicativa para evitar confusion.
* Palancas aclara que la cifra derivada de gastos confirmados es impacto sobre el numero de libertad, no una meta separada.
* El progreso hacia libertad financiera ahora se calcula contra capital invertido/productivo, separandolo del patrimonio neto total.
* Agregada regresion para que transporte fijo activo impacte Palancas FIRE.

## v2.3.2 - Money, Deuda Modular y Confianza del Parser

* Gastos fijos mensuales ahora resumen totales con `Money`, incluyendo equivalente USD y estado de conversion.
* La cartera objetivo usa `Money` en movimientos confirmados de inversion para evitar sumar pesos como dolares.
* Las formulas de deuda finita se extraen a `src/lib/debt-finance.ts` y se reexportan desde `finance.ts`.
* El parser agrega `confidence` por item detectado: alta, media o baja segun extraccion, intencion, categoria y certeza de deuda.
* La UI de notas muestra la confianza de cada item detectado antes de confirmar.
* Agregadas regresiones para Money en gastos fijos, Money en cartera, formulas de deuda y confianza del parser.

## v2.3.1 - Confiabilidad de Margen, Fechas, Cartera y Deuda

* Margen financiero evita duplicar un gasto fijo cuando el pago recurrente confirmado coincide con un gasto fijo activo.
* Fechas relativas y cortes mensuales usan la fecha local en vez de cortar por UTC serializado.
* Cartera objetivo pasa a calcular el actual como snapshot base + movimientos confirmados, sin elegir entre manual o derivado.
* La UI de cartera renombra el monto editable como snapshot base y muestra si el actual viene de snapshot, movimientos o ambos.
* La deuda detectada expone incertidumbre completa, parcial o insuficiente segun datos disponibles de cuota, plazo, principal y tasa.
* Agregadas regresiones para doble conteo, timezone local, snapshot + movimientos e incertidumbre de deuda.

## v2.3.0 - Money Type

* Bot Opera24hs pasa a mostrarse como `Bot especulacion (trading algoritmico)` y cuenta como clase editable dentro de la cartera objetivo.
* La cartera objetivo incorpora el capital asignado al bot como porcentaje junto a ETF USA, ETF Europa, emergentes, oro, Bitcoin e inmuebles.
* Las notas de inversion que mencionan `botopera24hs` o trading algoritmico se clasifican como `bot_especulacion`.
* Agregado el contrato `Money` con `amount`, `currency`, `usdAmount` y `conversionStatus`.
* El parser adjunta `money` a cada item detectado para distinguir conversiones exactas, fallback y faltantes.
* Las transacciones confirmadas reconstruyen `money` al cargarse desde Supabase.
* Los calculos financieros criticos consumen `Money` para evitar conversiones silenciosas a cero.
* Agregadas regresiones dedicadas para conversion exacta, fallback UYU y conversion faltante.
* La Politica Personal incorpora reglas de conducta basadas en la filosofia de inversion: automatizacion, indices primero, aumentos 70/20/10 y revision semanal.
* Los defaults de BTC, oro, acciones individuales e inmuebles ahora reflejan mejor el plan personal y mantienen la friccion antes de decisiones impulsivas.
* La ejecucion semanal queda integrada dentro de Revision para unir semana actual y cierre mensual en una sola superficie.

## v2.2.1 - Correccion Matematica Fase 1

* Corregida la lectura de montos con puntos y comas para evitar capturas truncadas como `USD 1.50` o `UYU 1.500`.
* Los gastos confirmados ahora reducen el patrimonio efectivo.
* Las inversiones confirmadas ahora aumentan capital invertido sin crear patrimonio neto artificial.
* Los montos UYU sin conversion guardada usan una cotizacion fallback en vez de desaparecer como cero.

## v2.2.0 - Revision Mensual

* Nueva seccion Revision para cerrar el mes con ingresos, gastos, tasa de ahorro, inversion, deuda, compras grandes y accion principal.
* Analizador `analyzeMonthlyReview` agregado sobre movimientos reales confirmados del mes.
* Estados mensuales: fuerte, correcto, debil y alerta, sin juicios ni cambios automaticos en dashboard, patrimonio, cartera, deuda o roadmap.
* La navegacion avanzada expone Revision y el dashboard puede sugerir cerrar el mes cuando hay alerta.
* Regresiones agregadas para mes fuerte, mes de alerta y mes sin datos confirmados.

## v2.1.0 - Reglas de Aumentos e Ingresos Extra

* Nueva seccion Aumentos para aplicar una regla editable 70/20/10 sobre aumentos confirmados.
* El analizador reutiliza ingresos y gastos confirmados para separar aumento, gasto absorbido y margen capturado.
* La vista muestra inversion sugerida, mejora de vida, gusto personal e impacto FIRE simulado.
* Las sugerencias no crean movimientos reales ni modifican patrimonio, cartera, deuda o roadmap sin confirmacion manual.

## v2.0.9 - Navegacion avanzada

* Avanzado ya no muestra la seccion Macro.

## v1.9.0 - Politica Personal de Inversion

* Nueva seccion Politica para revisar reglas de inversion antes de actuar.
* La politica existente de cartera ahora muestra cumplimiento, advertencias y accion principal.
* Reglas nuevas para subidas fuertes, no tocar el plan, ultima revision y friccion de cambios.
* Modo Decision muestra advertencias de politica para inversiones, BTC, oro, inmuebles y decisiones con impulso/FOMO.
* Cartera conserva asignacion objetivo y deriva advertencias desde la politica sin crear movimientos reales.

## v2.0.8 - Equivalente USD en gastos fijos

* Total de gastos fijos mensuales muestra el equivalente USD cuando hay gastos activos en UYU y cotizacion disponible.
* Margen financiero destaca el margen estimado cuando hay ingreso mensual fijo estimado cargado en configuracion.
* Margen disponible usa ingreso fijo estimado como fallback cuando todavia no hay ingreso confirmado del mes, sin sumar ambos.
* Margen disponible positivo se muestra en verde aunque el estado general siga fragil por deuda.
* Configuracion renombra el ingreso fijo estimado como ingreso base mensual para aclarar que alimenta el margen operativo.

## v2.0.7 - Gastos fijos UYU en margen

* Margen financiero convierte gastos fijos UYU activos a USD para que vivienda, transporte, comida y otros esenciales impacten el margen y la lectura de esenciales.

## v2.0.6 - Ingreso fijo estimado

* Datos base agrega ingreso mensual fijo estimado como supuesto separado del ingreso confirmado.
* Margen financiero muestra ingreso fijo estimado y margen estimado sin contarlos como movimientos reales.
* Aporte mensual aclara que representa lo que se planea invertir o separar, no el salario.

## v2.0.5 - Equivalencia USD para notas UYU

* Las notas consultan la cotizacion diaria USD/UYU de DolarAPI Uruguay.
* Los items detectados en UYU muestran y guardan una equivalencia informativa en USD con tasa, fecha y fuente.
* Margen financiero y resumenes en USD usan la equivalencia USD de movimientos UYU confirmados en vez de sumar pesos como dolares.
* Nueva migracion Supabase para persistir la equivalencia USD en transacciones confirmadas.
* Si la cotizacion no esta disponible, la captura y confirmacion de notas siguen funcionando sin bloquearse.

## v1.8.0 - Modo Decision MVP

* Nueva pantalla Decisiones para evaluar una decision antes de ejecutarla.
* Entrada en lenguaje natural con deteccion basica de tipo, monto, moneda, cuotas, deuda/interes, categoria, intent, negacion y senales emocionales.
* Lectura simulada de impacto mensual, impacto FIRE e impacto roadmap sin tocar datos confirmados.
* Riesgo bajo, medio, alto o sin datos explicado con factores visibles simples.
* Datos faltantes, checklist anti-error y acciones seguras: esperar 48 horas, guardar intencion local, convertir en borrador local, pedir mas datos o descartar.
* Sin persistencia Supabase nueva, sin confirmacion real y sin cambios en formulas centrales.

## v2.0.4 - Notas en moneda local y patrimonio

* Las notas nuevas usan UYU como moneda base y permiten elegir moneda por nota.
* El parser respeta la moneda elegida cuando el texto no trae USD/UYU explicito.
* Los gastos confirmados desde notas ya no reducen el patrimonio efectivo del dashboard.
* Datos base ya no muestra placeholders numericos de ejemplo.
* Gastos fijos renombra el total a "Total gastos fijos mensuales".
* Migracion Supabase para guardar la moneda de cada nota.

## v2.0.3 - Fase 1C de claridad operativa

* Navegación principal reducida a tabs compactos: Dashboard, Notas, Margen y Configuración.
* Decisiones, Cartera, Deuda, Palancas, Estilo, Semana, Roadmap y Macro pasan a una fila secundaria avanzada.
* Dashboard enfocado en libertad financiera, margen mensual, patrimonio/capital, próximos pasos y captura rápida.
* Header más bajo, con menos borde, menos cajas y navegación secundaria más liviana.

## v2.0.2 - Fase 1B de estabilidad

* Cuentas nuevas ahora arrancan sin patrimonio, capital invertido, gasto mensual ni aporte mensual de ejemplo como datos activos.
* Dashboard con estado vacio guiado para cargar datos base o confirmar la primera nota.
* Errores de persistencia Supabase mas accionables cuando faltan tablas o funciones RPC.
* README actualizado con setup Supabase, variables de entorno, migraciones y flujo de despliegue.

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
* Sugerencia de inversion automatica.

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
* Recomendaciones conectadas con Palancas FIRE, regla 70/20/10, compras grandes y vivienda/transporte/comida.
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
* Calculo de margen disponible, presion de deuda, tasa de ahorro y estado general.
* Gastos fijos activos conectados como supuestos separados, sin convertirlos en transacciones confirmadas.
* Separacion entre gastos esenciales, no esenciales, deuda mensual y punto de tranquilidad.
* Dashboard operativo muestra el margen mensual y prioriza la revision cuando el estado es fragil o ajustado.
* Tests de margen financiero agregados usando solo movimientos reales y descartando intenciones.

Todas las versiones verificadas con:

* npm run lint
* npm run build
* npm run test:parser
