# v1.9.0 Politica Personal de Inversion Design Spec

## Estado

Spec aprobada por direccion de producto. La prioridad es proteger al usuario de cambios impulsivos de estrategia sin convertir la app en asesor financiero.

## Proposito

La Politica Personal de Inversion debe funcionar como una constitucion simple del plan. Define reglas estables para invertir, rebalancear y evaluar activos sensibles antes de que una decision entre al sistema como accion real.

El modulo no recomienda comprar ni vender. Muestra si una decision o cartera se alinea con reglas ya escritas por el usuario, que datos faltan y que friccion conviene aplicar.

## Principio Central

El plan se escribe en frio y se respeta en caliente. Cualquier cambio importante a la politica debe ser explicito, visible y con una friccion minima de confirmacion.

Las decisiones simuladas, notas no confirmadas y cambios de politica no deben modificar patrimonio, cartera real, deuda, dashboard ni roadmap hasta que pasen por los flujos manuales existentes.

## Alcance v1.9.0

La version debe convertir la politica basica que ya vive dentro de Cartera en una capa mas util y visible:

- vista dedicada de Politica;
- resumen de reglas activas;
- lectura de cumplimiento contra cartera actual;
- lectura de violaciones o advertencias contra una decision simulada;
- revision de cambios importantes antes de guardarlos;
- fecha de ultima revision;
- conexion con Modo Decision para inversiones, BTC, oro, acciones individuales, inmuebles, deuda y FOMO;
- persistencia usando la configuracion de cartera ya existente, sin tabla nueva salvo necesidad fuerte.

## Fuera De Alcance

Queda fuera:

- asesoramiento financiero determinista;
- predicciones de rendimiento;
- optimizacion automatica de cartera;
- rebalanceo automatico;
- ordenes de compra o venta;
- persistencia historica completa de versiones anteriores de politica;
- cambios automaticos en transacciones confirmadas;
- bloquear al usuario de forma absoluta.

## Modelo De Datos

Extender `InvestmentPolicySettings` en `src/lib/finance.ts`.

Campos existentes a preservar:

- `monthlyContributionTarget`;
- `salaryInvestmentPercent`;
- `emergencyFundMonths`;
- `rebalanceTolerancePercent`;
- `rebalanceFrequency`;
- `drawdownRule`;
- `bitcoinRule`;
- `goldRule`;
- `individualStocksRule`;
- `realEstateRule`.

Campos nuevos propuestos:

```ts
type PolicyChangeFriction = "none" | "review" | "wait_48h";

type InvestmentPolicySettings = {
  // existing fields...
  strongRallyRule: string;
  noTouchRule: string;
  lastReviewedAt?: string;
  changeFriction: PolicyChangeFriction;
};
```

No agregar nueva tabla Supabase en v1.9.0. La politica ya viaja dentro de `TargetPortfolioSettings.policy`, persistida junto con cartera objetivo.

## Analisis De Politica

Agregar una funcion pura:

```ts
type InvestmentPolicyAnalysis = {
  policy: InvestmentPolicySettings;
  rules: InvestmentPolicyRuleStatus[];
  activeWarnings: InvestmentPolicyWarning[];
  violatedRuleCount: number;
  warningRuleCount: number;
  alignedRuleCount: number;
  summary: string;
  primaryAction: string;
};
```

Debe leer:

- cartera objetivo y cartera actual;
- desbalances por activo;
- fondo de emergencia disponible si existe via margen;
- decision simulada opcional de Modo Decision;
- senales emocionales opcionales.

Reglas iniciales:

- aporte mensual objetivo cargado;
- porcentaje de salario a invertir cargado;
- colchon objetivo cargado;
- tolerancia de rebalanceo definida;
- frecuencia de rebalanceo definida;
- BTC dentro del objetivo o marcado como alerta;
- oro dentro del objetivo o marcado como alerta;
- acciones individuales requieren regla explicita;
- inmuebles requieren regla explicita;
- caidas fuertes requieren regla escrita;
- subidas fuertes requieren regla escrita;
- regla de no tocar el plan escrita;
- decisiones con FOMO, impulso o comparacion sugieren esperar 48 horas.

## Vista Dedicada

Agregar seccion `politica` en navegacion secundaria, cerca de Cartera y Decisiones.

La vista debe tener:

- cabecera compacta con estado del plan;
- bloque "Reglas activas" con conteo sobrio;
- bloque "Cumplimiento" con reglas alineadas, advertencias y violaciones;
- editor de politica con campos numericos y textos;
- boton "Marcar revision" que actualiza `lastReviewedAt`;
- copy claro: "Plan, no opinion del mercado";
- aviso de que cambiar reglas no crea movimientos.

No usar hero, gamificacion ni tarjetas decorativas. Debe sentirse como documento operativo.

## Conexion Con Cartera

La vista de Cartera mantiene asignacion objetivo y montos. La politica puede seguir visible de forma compacta, pero el editor completo debe vivir en `politica`.

Cartera debe mostrar advertencias de politica cuando:

- un activo esta fuera de tolerancia;
- BTC supera el objetivo por encima de la tolerancia;
- oro supera o queda muy por debajo del objetivo por encima de la tolerancia;
- bienes raices o acciones individuales no tienen regla suficiente.

## Conexion Con Modo Decision

Modo Decision debe mostrar una lectura de politica cuando la decision detectada sea:

- inversion potencial;
- BTC o cripto;
- oro;
- acciones individuales;
- inmueble;
- deuda o compra con senales emocionales;
- decision marcada por FOMO, impulso, comparacion o premio personal.

La lectura debe decir:

- regla aplicable;
- estado: alineada, advertencia o violacion;
- accion prudente: esperar 48 horas, revisar politica, pedir mas datos o convertir en borrador.

No debe decir "compra", "vende" ni "no compres".

## Cambios Importantes De Politica

Un cambio es importante si toca:

- porcentaje de salario a invertir;
- aporte mensual objetivo;
- tolerancia de rebalanceo;
- regla de BTC;
- regla de oro;
- regla ante caidas fuertes;
- regla ante subidas fuertes;
- regla de no tocar el plan.

Para v1.9.0, la friccion minima es visual y manual:

- mostrar aviso "Estas cambiando una regla de largo plazo";
- guardar solo cuando el usuario use el control normal de edicion;
- registrar `lastReviewedAt` solo con accion explicita.

No hace falta implementar temporizador real de 48 horas para cambios de politica en esta version.

## Estados Vacios

Si la politica esta incompleta:

- mostrar reglas faltantes;
- sugerir completar primero colchon, aporte, tolerancia y regla de no tocar el plan;
- no inventar cumplimiento.

Si no hay cartera o transacciones:

- mostrar solo calidad del plan escrito;
- separar "sin datos reales" de "reglas incompletas".

## Testing

Agregar tests puros en `tests/parser-regression.ts` o archivo equivalente cubierto por `npm run test:parser`.

Casos minimos:

- politica completa sin cartera muestra reglas alineadas por configuracion;
- desbalance fuera de tolerancia genera advertencia;
- BTC sobre objetivo genera advertencia/violacion;
- decision BTC con FOMO sugiere esperar 48 horas;
- falta regla de no tocar el plan aparece como regla faltante;
- normalizacion preserva defaults para campos nuevos.

## Archivos Afectados

- `src/lib/finance.ts`;
- `src/lib/decision-mode.ts`;
- `src/components/libertad-dashboard.tsx`;
- `src/components/libertad-dashboard/types.ts`;
- `src/components/libertad-dashboard/portfolio-panel.tsx`;
- nuevo componente candidato `src/components/libertad-dashboard/investment-policy-panel.tsx`;
- `tests/parser-regression.ts`;
- `CHANGELOG.md`;
- `ROADMAP.md`.

## Criterios De Aceptacion

- existe una vista dedicada de Politica;
- la politica existente no se duplica ni se pierde;
- los campos nuevos tienen defaults y normalizacion;
- la politica muestra reglas activas, advertencias y accion principal;
- Cartera y Modo Decision pueden mostrar advertencias de politica;
- ningun cambio de politica crea transacciones ni modifica datos confirmados;
- no se agrega dependencia nueva;
- pasan `npm run test:parser`, `npm run lint` y `npm run build`.

## Spec Self-Review

- No hay placeholders ni secciones abiertas.
- El alcance cabe en un modulo y reutiliza persistencia existente.
- La spec preserva confirmacion manual y separa simulacion de datos reales.
- La UI propuesta es operativa, no marketing.
- Los riesgos principales son evitar duplicar Cartera y evitar lenguaje de consejo financiero determinista.
