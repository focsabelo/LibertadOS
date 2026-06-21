# v1.8.0 Modo Decision Design Spec

## Estado

Spec formal para revision de producto. No incluye UI final, wireframes ni implementacion.

## Proposito

Modo Decision es un evaluador previo guiado para decisiones financieras posibles. Su trabajo es tomar una decision escrita en lenguaje natural, interpretarla como simulacion, mostrar consecuencias, datos faltantes, riesgo explicable y fricciones utiles antes de que el usuario ejecute algo.

No es una pantalla de asesoramiento financiero. No decide por el usuario. No convierte decisiones hipoteticas en datos reales.

## Principio Central

Toda decision en Modo Decision empieza como simulacion. Nada modifica dashboard, patrimonio, gasto mensual, deuda, cartera, roadmap ni notas confirmadas sin una accion explicita de confirmacion manual.

Para el MVP, la accion segura principal es guardar como intencion o convertir en nota borrador/no confirmada. Confirmar como transaccion real puede existir solo si pasa por una revision manual clara y compatible con el flujo de Notas; no debe ser automatico.

## Alcance MVP Exacto

El MVP cubre estos casos:

- gasto o compra potencial: "quiero comprar un iPhone de USD 900";
- deuda, cuotas o prestamo: "me ofrecieron un prestamo", "lo pago en 12 cuotas";
- inversion potencial: "voy a invertir USD 500 en BTC";
- intencion o pensamiento: "estoy pensando en comprar", "pense en cambiar el auto";
- negacion: "no compre", "no gaste";
- guardar como intencion sin afectar datos reales.

El MVP debe permitir:

- escribir una decision en lenguaje natural;
- detectar tipo, monto, moneda, cuotas/plazo/tasa, categoria, recurrencia, intent, senales emocionales y datos faltantes;
- mostrar impacto mensual estimado;
- mostrar impacto FIRE estimado;
- mostrar riesgo bajo, medio, alto o sin datos;
- explicar el riesgo con factores visibles;
- editar factores de riesgo y senales emocionales;
- elegir una accion segura: esperar 48 horas, guardar como intencion, convertir a nota borrador, pedir mas datos o descartar.

El MVP no necesita resolver:

- persistencia historica completa de todas las decisiones;
- conversion directa a transaccion confirmada si eso complica la separacion entre simulacion y realidad;
- comparacion entre multiples escenarios complejos;
- optimizacion financiera.

## Fuera De Alcance Para v1.8.0

Queda fuera de alcance:

- asesoramiento financiero determinista;
- recomendaciones de compra o venta;
- instrucciones como "compra", "vende", "inverti" o "no compres";
- scoring complejo u opaco;
- simulador financiero avanzado;
- predicciones de rentabilidad;
- optimizacion de cartera;
- cambios automaticos en dashboard;
- cambios automaticos en patrimonio;
- cambios automaticos en gasto mensual;
- cambios automaticos en deuda confirmada;
- cambios automaticos en cartera real;
- cambios automaticos en roadmap real;
- modificacion de notas confirmadas;
- nuevas dependencias salvo justificacion fuerte.

## Ubicacion Del Modulo

Modo Decision vive como modulo/pagina propia dentro de la seccion `decisiones`, ya prevista en la navegacion.

Conexion con Notas:

- una decision puede escribirse directamente en Modo Decision;
- una decision puede convertirse en nota borrador por accion explicita;
- una nota existente puede abrirse como decision simulada solo por accion explicita;
- guardar como intencion no confirma una nota;
- guardar como intencion no crea una transaccion;
- una decision simulada no aparece mezclada con notas confirmadas;
- una nota confirmada sigue siendo fuente de datos reales; una decision simulada no.

## Modelo De Datos Inicial

Modelo conceptual:

```ts
type DecisionDetectedType =
  | "gasto_potencial"
  | "deuda_potencial"
  | "inversion_potencial"
  | "ahorro_potencial"
  | "intencion"
  | "pensamiento"
  | "negacion"
  | "mixta"
  | "desconocida";

type DecisionIntent = "real" | "intencion" | "pensamiento" | "negacion";

type DecisionRiskLevel = "bajo" | "medio" | "alto" | "sin_datos";

type DecisionFlowState =
  | "vacio"
  | "escribiendo"
  | "detectado"
  | "incompleto"
  | "simulacion_lista"
  | "espera_48h"
  | "guardado_como_intencion"
  | "confirmable"
  | "confirmado"
  | "descartado";

type DecisionChosenAction =
  | "sin_accion"
  | "esperar_48h"
  | "guardar_como_intencion"
  | "convertir_a_nota_borrador"
  | "pedir_mas_datos"
  | "confirmar_manualmente"
  | "descartar";

type DecisionRiskFactor = {
  id: string;
  label: string;
  severity: "baja" | "media" | "alta";
  active: boolean;
  editable: boolean;
  explanation: string;
};

type SimulatedDecision = {
  id: string;
  originalText: string;
  detectedType: DecisionDetectedType;
  amount?: number;
  currency?: "USD" | "UYU";
  installments?: number;
  termMonths?: number;
  interestRate?: number;
  category?: string;
  recurring: boolean;
  intent: DecisionIntent;
  emotionalSignals: string[];
  missingFields: string[];
  estimatedMonthlyImpact: number;
  estimatedFireImpact: number;
  riskLevel: DecisionRiskLevel;
  riskFactors: DecisionRiskFactor[];
  state: DecisionFlowState;
  chosenAction: DecisionChosenAction;
  createdAt: string;
  updatedAt: string;
};
```

Campos obligatorios del modelo:

- `originalText`: texto original escrito por el usuario.
- `detectedType`: tipo detectado de decision.
- `amount`: monto detectado o editado.
- `currency`: moneda detectada o elegida.
- `installments`, `termMonths`, `interestRate`: cuotas, plazo y tasa cuando aplica.
- `category`: categoria detectada o corregida.
- `recurring`: si el impacto es recurrente.
- `intent`: real, intencion, pensamiento o negacion.
- `emotionalSignals`: impulso, FOMO, comparacion, estatus, cansancio u otras senales.
- `missingFields`: datos faltantes para evaluar bien.
- `estimatedMonthlyImpact`: impacto mensual simulado.
- `estimatedFireImpact`: impacto FIRE simulado.
- `riskLevel`: nivel de riesgo explicable.
- `riskFactors`: factores que justifican el nivel de riesgo.
- `state`: estado del flujo.
- `chosenAction`: accion elegida por el usuario.

Notas:

- `originalText` siempre se preserva.
- `estimatedMonthlyImpact` no modifica gasto mensual real.
- `estimatedFireImpact` no modifica numero FIRE real.
- `riskLevel` se calcula desde factores visibles y editables; no debe ser caja negra.
- `confirmado` existe como estado conceptual para una futura confirmacion manual, pero no habilita confirmacion automatica.

## Estados Del Flujo

- `vacio`: no hay decision activa. La pantalla invita a evaluar antes de actuar.
- `escribiendo`: el usuario redacta. No hay datos reales ni confirmacion.
- `detectado`: el sistema interpreto tipo, intent y campos principales.
- `incompleto`: faltan datos necesarios como monto, moneda, cuotas, plazo, tasa o recurrencia.
- `simulacion_lista`: hay suficientes datos para mostrar impacto y riesgo simulados.
- `espera_48h`: el usuario eligio friccion temporal para revisar despues.
- `guardado_como_intencion`: la decision queda como intencion, sin afectar datos reales.
- `confirmable`: solo si el texto y los campos representan una accion real, sin negacion ni pensamiento hipotetico.
- `confirmado`: solo despues de una accion explicita y revisable del usuario; no es automatico.
- `descartado`: la decision sale del flujo activo y no afecta nada.

Reglas de estado:

- `intencion`, `pensamiento` y `negacion` no deben pasar a `confirmable` sin edicion explicita del usuario.
- `confirmable` no significa confirmado.
- `confirmado` no puede saltarse la revision manual.
- `guardado_como_intencion` no afecta formulas ni dashboard.

## Flujo Paso A Paso

1. El usuario entra a `Decisiones`.
2. Escribe una decision posible.
3. El sistema analiza el texto reutilizando logica del parser cuando tenga sentido.
4. El resultado se crea como `SimulatedDecision`, no como nota confirmada ni transaccion.
5. El usuario ve interpretacion, datos faltantes y factores de riesgo.
6. El usuario corrige monto, moneda, cuotas, tasa, categoria, recurrencia, intent o senales emocionales.
7. El sistema recalcula impacto mensual estimado, impacto FIRE estimado y riesgo explicable.
8. El usuario elige una accion: esperar 48 horas, guardar como intencion, convertir a nota borrador, pedir mas datos, confirmar manualmente si aplica, o descartar.
9. Si guarda como intencion, no cambia ningun dato financiero real.
10. Si convierte a nota borrador, la nota queda no confirmada.
11. Si confirma manualmente en una futura version o flujo habilitado, debe revisar exactamente que movimiento se creara.

## Reglas Duras

- Nada modifica dashboard sin confirmacion explicita.
- Nada modifica patrimonio sin confirmacion explicita.
- Nada modifica gasto mensual sin confirmacion explicita.
- Nada modifica deuda confirmada sin confirmacion explicita.
- Nada modifica cartera real sin confirmacion explicita.
- Nada modifica roadmap real sin confirmacion explicita.
- Nada modifica notas confirmadas sin confirmacion explicita.
- Intencion no es gasto real.
- Pensamiento no es gasto real.
- Negacion no es gasto real.
- Simulacion no modifica patrimonio, deuda, cartera, gasto mensual ni roadmap.
- Inversiones potenciales no alimentan cartera real.
- Deuda, cuotas y prestamos deben mostrar costo real estimado o datos faltantes.
- Si faltan tasa, plazo, cuota o monto principal, el sistema debe decir que falta, no inventar precision.
- Senales emocionales deben ser editables.
- Senales emocionales deben redactarse sin acusar ni juzgar.
- El lenguaje debe mostrar consecuencias, fricciones y datos faltantes; no ordenes.

## Riesgo Explicable Y Editable

El riesgo se construye desde `riskFactors`.

Factores iniciales:

- monto alto;
- impacto alto sobre margen mensual;
- cuotas o financiacion;
- prestamo;
- tarjeta;
- pago minimo;
- tasa/interes alta;
- tasa/interes desconocida;
- recurrencia nueva;
- categoria critica: vivienda, transporte o comida;
- compra grande de tecnologia, auto o estatus;
- inversion concentrada o especulativa;
- impulso;
- FOMO;
- comparacion;
- consumo emocional;
- datos criticos faltantes.

Regla inicial:

- `sin_datos`: no hay monto, moneda o tipo suficiente para calcular.
- `bajo`: impacto bajo, pocos factores activos y sin deuda riesgosa.
- `medio`: impacto moderado, compra grande, cuotas, recurrencia nueva o alguna senal emocional.
- `alto`: deuda costosa, pago minimo, impacto fuerte sobre margen, multiples senales emocionales o datos criticos faltantes en deuda/cuotas.

El usuario debe poder editar:

- si un factor esta activo;
- recurrencia;
- categoria;
- monto y moneda;
- cuotas, plazo y tasa;
- senales emocionales.

## Confirmacion Manual Vs Simulacion

Permanece como simulacion:

- "quiero comprar";
- "pense en comprar";
- "estoy pensando";
- "casi compro";
- "me ofrecieron un prestamo";
- "voy a invertir";
- decisiones con datos incompletos;
- decisiones mixtas no separadas;
- cualquier decision marcada como intencion, pensamiento o negacion.

Puede guardarse como intencion:

- una decision que el usuario quiere revisar luego;
- una decision en espera 48 horas;
- una decision convertida a nota borrador/no confirmada.

Puede ser confirmable solo si:

- el texto expresa una accion real o el usuario cambia explicitamente el intent a real;
- no hay negacion;
- no queda clasificada como pensamiento o intencion;
- tiene monto y moneda;
- tiene tipo compatible con gasto, deuda, inversion, ahorro o ingreso;
- el usuario revisa que se va a guardar.

Para v1.8.0, la implementacion puede dejar la confirmacion real fuera del MVP y limitarse a guardar intencion/nota borrador si eso reduce riesgo.

## Conexion Con Parser Y Notas

Reutilizar logica del parser para:

- monto;
- moneda;
- tipo;
- categoria;
- cuotas;
- deuda;
- inversion;
- negacion;
- intencion;
- pensamiento;
- senales de impulso, FOMO, comparacion o consumo emocional.

No mezclar objetos:

- nota confirmada no es decision simulada;
- decision simulada no es transaccion;
- intencion guardada no es gasto real;
- inversion potencial no es inversion confirmada;
- deuda potencial no es deuda confirmada.

Conexion segura:

- `convertir_a_nota_borrador` crea o prepara una nota no confirmada;
- la nota debe pasar por el flujo normal de deteccion y confirmacion;
- no se deben modificar notas confirmadas automaticamente;
- no se deben crear transacciones desde decisiones hipoteticas.

## Edge Cases

- "quiero comprar": intent `intencion`, tipo `gasto_potencial`; no confirmable por defecto.
- "pense en comprar": intent `pensamiento`, tipo `gasto_potencial`; no confirmable.
- "no compre": intent `negacion`, tipo `negacion`; no gasto real.
- "casi compro": intent `pensamiento`, tipo `gasto_potencial`; puede sugerir guardar intencion o descartar.
- "me ofrecieron un prestamo": tipo `deuda_potencial`, intent `intencion` o `pensamiento`; pedir monto, plazo, tasa y cuota.
- "compre": puede ser `confirmable` si hay monto/moneda suficientes, pero no confirmado sin accion explicita.
- "voy a invertir": tipo `inversion_potencial`, intent `intencion`; no alimenta cartera.
- "inverti": puede ser `confirmable` si hay monto/moneda/categoria suficientes, pero no confirmado sin accion explicita.
- Montos sin moneda: usar moneda por defecto solo como sugerencia editable; marcar moneda como dato a revisar.
- Cuotas sin interes: calcular cuota mensual si hay cuota o monto/plazo, pero marcar tasa/interes como dato faltante.
- Decisiones mixtas: marcar `mixta`, pedir separar decisiones antes de confirmar o guardar como intencion general.
- Monto sin tipo: marcar `desconocida` o `incompleto`; pedir mas contexto.
- Tipo sin monto: mostrar riesgo `sin_datos`; no calcular impacto fuerte.
- Recurrencia ambigua: asumir no recurrente hasta confirmacion del usuario.
- Senal emocional mal detectada: permitir desactivarla.

## Copy Y Tono

Usar lenguaje prudente:

- "Lectura simulada."
- "No modifica tus datos confirmados."
- "Faltan datos para estimar costo real."
- "Esto podria aumentar tu presion mensual."
- "Esta decision tiene senales de impulso editables."
- "Podrias esperar 48 horas antes de confirmar."

Evitar lenguaje determinista:

- "Compra esto."
- "No compres esto."
- "Vende."
- "Inverti ahora."
- "Operacion recomendada."
- "Estas haciendo algo mal."

## Archivos Candidatos A Tocar

Sin implementar todavia, los archivos candidatos son:

- `ROADMAP.md`: actualizar estado de v1.8.0 cuando el MVP este implementado y verificado.
- `CHANGELOG.md`: agregar entrada de v1.8.0 cuando corresponda.
- `src/lib/finance.ts`: tipos y analizador puro de decisiones simuladas.
- `src/lib/financial-notes.ts`: reutilizar o extraer deteccion de intent, negacion, montos, cuotas, deuda, inversion y senales emocionales.
- `src/components/libertad-dashboard.tsx`: conectar la seccion `decisiones` al modulo dedicado.
- `src/components/libertad-dashboard/decision-mode-panel.tsx`: componente candidato para el modulo.
- `tests/parser-regression.ts`: casos de gasto potencial, deuda/cuotas, inversion potencial, intencion, pensamiento, negacion, mixtas y riesgo.
- `src/lib/supabase-persistence.ts`: solo si se decide persistir intenciones simuladas en Supabase.
- `supabase/migrations`: solo si se agrega tabla privada para decisiones/intenciones simuladas.

No tocar salvo necesidad explicita:

- formulas centrales de patrimonio;
- formulas centrales de FIRE;
- confirmacion atomica de notas;
- transacciones confirmadas existentes;
- cartera objetivo real;
- deuda confirmada;
- roadmap real;
- RLS existente, salvo nueva tabla privada con politicas por `auth.uid() = user_id`.

## Riesgos De Producto

- Mezclar simulacion con datos confirmados.
- Crear una confirmacion demasiado facil desde una decision hipotetica.
- Duplicar Notas en vez de crear un evaluador previo.
- Hacer el riesgo opaco.
- Dar asesoramiento financiero determinista.
- Usar copy culpabilizante.
- Sobrecargar el parser con demasiadas variantes en el MVP.
- Agregar dependencias innecesarias.

## Criterios De Aceptacion Del MVP

- Modo Decision vive en la seccion `decisiones`.
- Permite evaluar una decision sin afectar datos reales.
- Cubre gasto/compra potencial, deuda/cuotas/prestamo, inversion potencial, intencion/pensamiento, negacion y guardar como intencion.
- Muestra texto original, tipo detectado, monto, moneda, cuotas/plazo/tasa, categoria, recurrencia, intent, senales emocionales y datos faltantes.
- Muestra impacto mensual estimado e impacto FIRE estimado como simulacion.
- Muestra riesgo bajo/medio/alto/sin datos con factores visibles y editables.
- Guardar como intencion no modifica dashboard, patrimonio, gasto mensual, cartera, deuda, roadmap ni notas confirmadas.
- Inversiones potenciales no alimentan cartera real.
- Deuda/cuotas muestran costo real estimado o datos faltantes.
- Senales emocionales son editables y no acusatorias.
- No hay UI final en esta spec.
- Antes de cerrar implementacion futura deben pasar `npm run test:parser`, `npm run lint` y `npm run build`.

## Sensacion Visual Esperada Para Wireframes Posteriores

No se define UI final todavia.

La direccion visual futura debe sentirse como una sala sobria de evaluacion:

- entrada tipo nota;
- interpretacion estructurada;
- consecuencias simuladas separadas de datos reales;
- factores de riesgo visibles;
- acciones prudentes;
- tono serio, calmado y premium;
- nada de trading, gamificacion o estetica fintech ruidosa.

## Spec Self-Review

- La spec cierra el alcance MVP exacto.
- Fuera de alcance queda explicito para evitar sobreconstruccion.
- El modelo contiene todos los campos obligatorios: texto original, tipo, monto, moneda, cuotas/plazo/tasa, categoria, recurrencia, intent, senales emocionales, datos faltantes, impacto mensual estimado, impacto FIRE estimado, riesgo, estado y accion elegida.
- Los estados incluyen vacio, escribiendo, detectado, incompleto, simulacion lista, espera 48 horas, guardado como intencion, confirmable, confirmado y descartado.
- Las reglas duras separan simulacion, intencion, negacion y datos reales.
- Los edge cases pedidos estan cubiertos uno por uno.
- No se propone UI final ni implementacion.
