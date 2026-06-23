# Libertad OS

Libertad OS es un sistema personal para medir el camino hacia la libertad financiera. Combina un dashboard financiero sobrio con una superficie de notas estilo iCloud Notes: primero se captura en lenguaje natural, despues el sistema interpreta, y solo con confirmacion explicita los datos pasan a impactar el dashboard.

La regla central es simple:

```text
capturar primero, contabilizar despues
```

## Para Que Sirve

Libertad OS ayuda a:

- ver el numero de libertad financiera;
- entender cuanto falta para llegar;
- registrar ingresos, gastos, inversiones, ahorros, deudas y decisiones;
- distinguir hechos reales de intenciones, ideas, simulaciones o negaciones;
- revisar el margen mensual y la presion de gastos fijos/deuda;
- ordenar la cartera objetivo y la politica personal de inversion;
- evitar inflacion del estilo de vida cuando suben los ingresos;
- hacer una revision semanal y mensual sin convertir la app en contabilidad pesada.

El producto esta pensado para una persona que quiere construir libertad financiera con calma, claridad y disciplina, no para hacer trading, perseguir FOMO o llenar formularios contables perfectos.

## Regla De Oro

Nada detectado en una nota se vuelve dato real hasta que el usuario lo confirme.

Esto significa:

- una nota puede detectar gastos, ingresos, inversiones, ahorros, deudas y decisiones;
- el dashboard no cambia por escribir una nota;
- solo los items con `intent === "real"` y no ignorados se pueden confirmar;
- intenciones como "quiero gastar", pensamientos como "pense en comprar" y negaciones como "no gaste" no se guardan como movimientos reales;
- si editas una nota ya confirmada, sus movimientos anteriores dejan de contar hasta reconfirmar la nueva version.

## Conceptos Principales

### Numero De Libertad Financiera

El numero de libertad financiera se calcula asi:

```text
gasto mensual deseado x 12 x 25
```

Representa el capital invertido o productivo objetivo para cubrir tu gasto
anual con una tasa de retiro estimada del 4%. No es lo mismo que patrimonio
neto total.

Ejemplo: si queres vivir con USD 2.000 al mes, el numero es:

```text
2.000 x 12 x 25 = USD 600.000
```

### Progreso

El progreso se calcula comparando el capital invertido/productivo contra el
numero de libertad financiera.

```text
progreso = capital invertido / numero de libertad financiera
```

### Gasto Anual

```text
gasto anual = gasto mensual x 12
```

### Impacto En El Numero De Libertad De Un Gasto Recurrente

Reducir un gasto mensual permanente tiene impacto grande porque baja el numero de libertad financiera:

```text
reduccion mensual x 12 x 25
```

Por eso vivienda, transporte y comida son categorias prioritarias.

## Filosofia Financiera Del Sistema

Libertad OS sigue una filosofia conservadora y orientada a conducta:

- paciencia antes que especulacion;
- automatizar inversion para no depender de motivacion;
- indices simples antes que trading o acciones individuales;
- separar progreso real de simulaciones;
- evitar deuda usada para aparentar progreso;
- cuidar especialmente vivienda, transporte y comida;
- revisar numeros con frecuencia;
- proteger cada aumento de ingresos con una regla previa.

La regla sugerida para aumentos o ingresos extra es:

```text
70% ahorro o inversion
20% mejora de vida
10% gusto personal
```

Esta regla es editable, pero la idea de fondo se mantiene: el dinero nuevo debe tener destino antes de diluirse.

## Como Usar La App

### 1. Entrar Al Sistema

La app usa Supabase Auth. Para ver datos privados hay que iniciar sesion con email y contrasena.

Si es una cuenta nueva, la app arranca sin datos financieros de ejemplo. Primero hay que cargar datos base o confirmar la primera nota real.

### 2. Cargar Datos Base

Ir a `Configuracion` y completar los supuestos iniciales:

- patrimonio actual;
- capital invertido;
- gasto mensual deseado;
- aporte mensual planificado;
- ingreso base mensual, si aplica.

Estos datos son supuestos base. Sirven para calcular el dashboard, pero no reemplazan los movimientos confirmados desde notas.

### 3. Capturar Notas

Ir a `Notas` y escribir como si fuera una nota personal:

```text
Hoy gaste UYU 350 en comida y UYU 90 en transporte.
Cobre USD 1200.
Inverti USD 500 en ETF USA.
Pense en comprar una notebook de USD 900, pero todavia no la compre.
```

El sistema detecta estructura financiera y muestra una lectura previa. Antes de confirmar, revisar:

- tipo de movimiento;
- monto;
- moneda;
- categoria;
- intencion;
- si debe ignorarse;
- impacto FIRE;
- alertas de deuda, cuotas, compra grande o impulso.

### 4. Confirmar Solo Lo Real

Confirmar una nota solo cuando el movimiento ya ocurrio y los datos estan bien.

Buenas practicas:

- confirmar gastos ya realizados;
- confirmar ingresos cobrados;
- confirmar inversiones ejecutadas;
- no confirmar deseos, planes o simulaciones;
- marcar como ignorado cualquier item detectado que no corresponda;
- editar el intent si el parser interpreto algo de forma incorrecta.

### 5. Revisar El Dashboard

El `Dashboard` muestra:

- numero de libertad financiera;
- progreso total;
- falta para la meta;
- gasto anual;
- tiempo estimado;
- patrimonio invertido;
- margen mensual;
- proximos pasos sugeridos.

Usalo como vista de pulso, no como libro contable. Si algo se ve raro, revisar primero notas confirmadas, datos base y gastos fijos.

## Modulos Del Sistema

### Dashboard

Es la vista principal. Sirve para entender el estado general y decidir el siguiente paso.

Usar para:

- ver el numero FIRE;
- revisar progreso;
- detectar si falta cargar informacion;
- abrir rapidamente Notas o el paso sugerido.

No usar para:

- registrar movimientos manualmente;
- tomar decisiones sin revisar el detalle;
- confundir datos base con movimientos confirmados.

### Notas

Es el centro de captura. Permite escribir movimientos financieros en lenguaje natural, revisarlos y confirmarlos.

Detecta:

- gastos;
- ingresos;
- inversiones;
- ahorros;
- deudas;
- decisiones;
- senales de impulso, FOMO, comparacion o consumo emocional.

Practica recomendada:

- capturar rapido durante el dia;
- revisar antes de confirmar;
- confirmar al cierre del dia o durante la revision semanal;
- mantener el texto original de la nota como contexto.

### Margen

Muestra la libertad mensual real: ingresos, gastos fijos, gastos confirmados, deuda y margen disponible.

Usar para responder:

- "Me sobra margen este mes?";
- "Los gastos fijos estan presionando demasiado?";
- "La deuda consume demasiado ingreso?".

Importante: los gastos fijos son supuestos operativos. No son transacciones reales por si solos.

### Configuracion

Contiene datos base y gastos fijos mensuales.

Usar para:

- actualizar supuestos de patrimonio, gasto mensual y aporte mensual;
- cargar ingreso base mensual;
- crear, editar, activar o desactivar gastos fijos;
- registrar alquiler, servicios, transporte, comida base, suscripciones o cuotas recurrentes.

Buenas practicas:

- revisar datos base al menos una vez por mes;
- mantener gastos fijos activos solo si siguen vigentes;
- desactivar un gasto si ya no aplica, en vez de borrarlo sin pensar;
- usar UYU o USD segun corresponda.

### Decisiones

Permite analizar una decision antes de ejecutarla. Es especialmente util para compras grandes, deuda, cuotas, inversiones impulsivas o cambios de plan.

Usar para:

- evaluar una compra antes de hacerla;
- simular el impacto mensual;
- ver impacto FIRE;
- detectar riesgo por deuda, impulso, FOMO o falta de datos;
- decidir esperar 48 horas, pedir mas datos o convertir en nota.

No crea movimientos reales por si solo.

### Cartera

Muestra cartera objetivo vs cartera actual.

Clases contempladas:

- ETF USA;
- ETF Europa;
- ETF Mercados Emergentes;
- Oro;
- Bitcoin;
- Bienes raices;
- Bot especulacion, si aplica.

Usar para:

- revisar pesos objetivo;
- ver desbalances;
- separar snapshot base de inversiones confirmadas;
- evitar cambiar de plan por ruido de corto plazo.

La cartera no debe convertirse en una pantalla de trading.

### Politica

Reune reglas personales de inversion y conducta.

Usar para:

- revisar la politica antes de invertir;
- validar si una decision respeta el plan;
- mantener friccion antes de BTC, oro, acciones individuales, inmuebles o bot especulativo;
- recordar automatizacion, indices primero y revision semanal;
- definir la regla editable para aumentos o ingresos extra confirmados;
- simular cuanto dinero nuevo va a inversion, mejora de vida y gusto personal.

Regla sugerida para aumentos:

```text
70% inversion o ahorro
20% mejora de vida
10% gusto personal
```

### Deuda

Analiza deuda confirmada y costos asociados.

Usar para:

- ver carga mensual de deuda;
- entender costo total e intereses cuando hay datos suficientes;
- revisar cuotas, tarjetas, prestamos, hipotecas o financiacion;
- medir presion sobre margen mensual.

La app muestra consecuencias, no recomendaciones deterministas.

### Palancas

Ayuda a entender como cambios en gastos impactan el numero de libertad financiera.

Usar para:

- analizar vivienda, transporte y comida;
- ver escenarios de reduccion de gasto;
- priorizar gastos recurrentes que bajan el numero FIRE.

### Revision

Une ejecucion semanal, cierre mensual y senales de inflacion del estilo de vida.

Usar para:

- marcar checks semanales;
- revisar ingresos y gastos confirmados;
- confirmar aporte mensual;
- detectar deuda nueva;
- ver si un aumento fue absorbido por gasto;
- detectar compras grandes recientes;
- cuidar la tasa de ahorro;
- separar mejora de vida de gasto automatico;
- cerrar el mes con una accion principal.

### Roadmap

Muestra hitos patrimoniales.

Secuencia orientativa:

1. llegar a USD 50.000 invertidos;
2. usar ese capital como garantia para primer inmueble, si aplica;
3. seguir invirtiendo;
4. avanzar hacia 5 propiedades;
5. evaluar retiro parcial al llegar a USD 500.000;
6. continuar hacia USD 1.000.000.

El roadmap separa progreso real de simulaciones y no promete rentabilidad.

## Rutina Recomendada

### Todos Los Dias

- Capturar gastos, ingresos o decisiones en `Notas`.
- No buscar perfeccion: escribir rapido y revisar despues.
- Confirmar solo movimientos reales.
- Usar `Decisiones` antes de compras grandes, cuotas o deudas.
- Evitar confirmar impulsos sin revisar el filtro anti-error.

### Una Vez Por Semana

- Abrir `Revision`.
- Confirmar movimientos pendientes.
- Revisar si hubo ingresos, gastos, inversion mensual o deuda nueva.
- Mirar `Margen` para saber si el mes sigue sano.
- Revisar `Politica` si hubo ganas de cambiar de plan.
- Ejecutar una accion concreta: invertir, reducir un gasto o limpiar notas pendientes.

### Una Vez Por Mes

- Cerrar el mes en `Revision`.
- Revisar gastos confirmados vs ingresos confirmados.
- Actualizar `Configuracion` si cambiaron datos base.
- Revisar `Gastos fijos mensuales`.
- Mirar `Revision` para detectar inflacion del estilo de vida.
- Revisar `Cartera` y `Roadmap` sin sobreoperar.

### Cada Vez Que Suben Los Ingresos

- Registrar el ingreso real en `Notas`.
- Revisar `Politica`.
- Definir destino antes de gastar.
- Confirmar acciones reales solo despues de ejecutarlas.

### Antes De Endeudarse

- Usar `Decisiones`.
- Escribir monto, cuotas, tasa, plazo y contexto.
- Revisar costo total, cuota mensual y presion sobre margen.
- Esperar si faltan datos.
- No confirmar una deuda hasta que sea real y revisada.

## Ejemplos De Notas

Movimiento real:

```text
Gaste UYU 450 en comida y UYU 120 en transporte.
```

Ingreso real:

```text
Cobre USD 1800 de sueldo.
```

Inversion real:

```text
Inverti USD 500 en ETF USA.
```

Intencion, no confirmable:

```text
Quiero gastar USD 900 en una notebook.
```

Pensamiento, no confirmable:

```text
Pense en comprar un auto en cuotas.
```

Negacion, no confirmable:

```text
No gaste en ropa este mes.
```

Decision para revisar:

```text
Estoy evaluando sacar un prestamo de USD 5000 a 24 cuotas para cambiar el auto.
```

## Buenas Practicas Financieras

- Automatizar inversion apenas entra el ingreso.
- Separar ahorro o inversion antes de gastar.
- Revisar numeros semanalmente.
- Cuidar vivienda, transporte y comida.
- Mantener margen operativo sano y capital invertido con reglas claras.
- No pagar minimos de tarjeta como estrategia normal.
- No comprar activos o productos que no se entienden.
- No cambiar el plan cada dos semanas.
- No usar deuda para aparentar progreso.
- Distinguir placer barato de placer caro.
- No confundir ingresos altos con riqueza.
- Registrar decisiones importantes antes de ejecutarlas.

## Buenas Practicas De Datos

- Preservar el texto original de cada nota.
- Revisar datos detectados antes de confirmar.
- No borrar historico sin una razon clara.
- Preferir desactivar gastos fijos antes que eliminar informacion util.
- Mantener separadas notas, supuestos, simulaciones y datos confirmados.
- Si algo parece duplicado, revisar si viene de gasto fijo y tambien de una nota recurrente confirmada.
- Si una conversion UYU/USD no esta disponible, no forzar datos inventados.

## Desarrollo Local

Instalar dependencias:

```bash
npm install
```

Levantar la app:

```bash
npm run dev
```

La app suele correr en:

- [http://localhost:3000](http://localhost:3000)
- [http://127.0.0.1:3000](http://127.0.0.1:3000)

## Variables De Entorno

Crear `.env.local` en la raiz del proyecto:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
```

Reglas:

- usar solo `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` en codigo de cliente;
- no poner `service_role` en el frontend;
- no commitear `.env`, `.env.local`, secretos, API keys privadas o credenciales reales;
- mantener `.env.example` sin valores reales.

## Variables En Vercel

En Vercel, configurar las mismas variables en:

```text
Project Settings -> Environment Variables
```

Variables necesarias:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Aplicarlas al entorno correspondiente (`Production`, `Preview` y/o `Development`) y redeployar para que Next.js lea los valores nuevos.

## Supabase

La app guarda datos privados en Supabase. Toda tabla privada debe tener RLS habilitado y policies por usuario:

```text
auth.uid() = user_id
```

Nunca se debe acceder a datos privados desde el cliente sin sesion real.

### Migraciones Actuales

Las migraciones estan en `supabase/migrations`:

- `20260620120000_create_private_finance_tables.sql`
- `20260620143000_create_fixed_monthly_expenses.sql`
- `20260620143000_create_weekly_execution_reviews.sql`
- `20260620160000_atomic_financial_note_confirmation.sql`
- `20260620170000_add_financial_note_currency.sql`
- `20260621180000_add_confirmed_transaction_usd_conversion.sql`

Para ejecutarlas manualmente:

1. Abrir Supabase Dashboard.
2. Entrar al proyecto correcto.
3. Ir a SQL Editor.
4. Abrir cada archivo de `supabase/migrations` en orden.
5. Pegar el SQL completo.
6. Ejecutar y revisar que no haya errores.
7. Recargar la app.

Si se agrega una migracion nueva, tambien hay que ejecutarla en Supabase.

## Comandos De Verificacion

Usar verificacion proporcional al cambio.

```bash
npm run lint
npm run build
npm run test:parser
```

Guia rapida:

- cambios chicos de copy o README: no hace falta correr checks pesados;
- parser, formulas financieras, persistencia, Supabase o flujos de usuario: correr `npm run test:parser`;
- cambios amplios o antes de commit importante: correr lint, build y tests relevantes.

## Errores Frecuentes

### "Could not find table"

Falta una tabla en Supabase. Ejecutar las migraciones pendientes desde `supabase/migrations`.

Si menciona `fixed_monthly_expenses`, ejecutar:

```text
supabase/migrations/20260620143000_create_fixed_monthly_expenses.sql
```

Si menciona `weekly_execution_reviews`, ejecutar:

```text
supabase/migrations/20260620143000_create_weekly_execution_reviews.sql
```

### "function does not exist"

Falta una funcion RPC para guardar notas de forma atomica. Ejecutar:

```text
supabase/migrations/20260620160000_atomic_financial_note_confirmation.sql
```

Esa migracion crea `confirm_financial_note` y `save_financial_note_draft`.

### La Nota Detecta Algo Incorrecto

Antes de confirmar:

- editar tipo, monto, moneda, categoria o intent;
- marcar el item como ignorado si no corresponde;
- dejar sin confirmar si es una intencion, pensamiento o negacion.

### El Dashboard Parece Duplicar Un Gasto

Revisar si el gasto existe como gasto fijo activo y tambien como transaccion recurrente confirmada. El sistema intenta evitar doble conteo, pero la revision humana sigue siendo importante.

## Archivos Importantes

- `PRODUCT.md`: intencion del producto.
- `docs/FILOSOFIA_INVERSION.md`: filosofia financiera y criterios de conducta.
- `src/components/libertad-dashboard.tsx`: superficie principal.
- `src/components/financial-notes-module.tsx`: modulo de notas.
- `src/lib/finance.ts`: formulas y analisis financieros.
- `src/lib/financial-notes.ts`: parser y tipos de notas.
- `src/lib/supabase-persistence.ts`: persistencia Supabase.
- `src/lib/fixed-monthly-expenses.ts`: gastos fijos.
- `supabase/migrations`: cambios de esquema y RPC.
- `CHANGELOG.md`: historial de cambios.

## Flujo Correcto De Cambios

1. Entender si el cambio afecta producto, formulas, persistencia, UI o solo documentacion.
2. Cambiar el codigo o documentacion de forma acotada.
3. Crear o actualizar una migracion SQL si cambia esquema, tabla, policy o RPC.
4. Ejecutar la migracion en Supabase cuando corresponda.
5. Correr checks proporcionales al riesgo.
6. Revisar `git status` y `git diff`.
7. Stagear solo archivos relevantes.
8. Commit de codigo y migracion juntos cuando aplique.
9. Push solo si corresponde al flujo de trabajo.

No hacer push directo a `main` sin confirmacion del owner.

## Reglas Para Mantener El Sistema

- No cambiar formulas financieras casualmente.
- No convertir notas detectadas en datos reales sin confirmacion.
- No borrar, sobreescribir o migrar datos sin una migracion deliberada.
- No agregar dependencias si el stack actual alcanza.
- No exponer secretos.
- No desactivar RLS ni saltar seguridad desde cliente.
- Mantener el tono calmo, serio y practico.
- Evitar estetica de trading, crypto, gamificacion o fintech generica.
- Priorizar claridad sobre decoracion.
- Preservar la diferencia entre supuestos base, previews detectados, transacciones confirmadas y simulaciones.
