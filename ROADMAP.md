# ROADMAP

## Principio rector del producto

Libertad OS no debe ser una app para mirar números. Debe ser un sistema operativo personal para ejecutar reglas financieras, evitar errores grandes, construir patrimonio y proteger la libertad futura del usuario.

La prioridad del producto es convertir notas, intenciones y decisiones desordenadas en:

* datos confirmados;
* consecuencias financieras visibles;
* reglas de conducta;
* acciones semanales concretas.

## Estado actual

### v1.3.0 Anti-Errores y Compras Grandes - cerrado

Objetivo:
Ayudar a pensar antes de compras importantes.

Detectar:

* deuda;
* cuotas;
* financiación;
* tarjeta;
* FOMO;
* impulso;
* consumo emocional;
* compras grandes.

Mostrar:

* riesgo bajo, medio o alto;
* impacto FIRE;
* checklist anti-error;
* sugerencia de esperar 48 horas.

Regla:
No guardar compras futuras, ideas o intenciones como gastos reales.

Mejora implementada:
Cada alerta termina en una acción concreta: esperar, revisar, descartar, confirmar o convertir en plan.

---

### v1.4.0 Inflación del Estilo de Vida - cerrado

Objetivo:
Detectar cuando aumentan ingresos y también gastos.

Mostrar:

* evolución ingreso vs gasto;
* pérdida de ahorro;
* alertas de lifestyle inflation;
* señales de gasto que acompaña ingresos;
* caída de tasa de ahorro;
* compras grandes recientes;
* gastos críticos.

Estado:

* panel agregado al dashboard;
* usa solo transacciones confirmadas;
* compara mes actual contra mes anterior;
* muestra riesgo, señales y recomendación práctica.

Mejora implementada:
El panel muestra regla automática para aumentos: 70% ahorro/inversión, 20% mejora de vida, 10% gusto personal.

---

### v1.5.0 Deuda Real / TAE - cerrado

Objetivo:
Mostrar costo real de deudas, tarjetas, préstamos, cuotas, financiación e hipotecas sin dar recomendaciones financieras deterministas.

Estado:

* parser distingue deuda real, intención, negación, gasto con tarjeta, compras en cuotas, préstamos, hipotecas, auto y pago mínimo;
* las intenciones y análisis potenciales no entran al dashboard;
* deuda confirmada muestra cuota mensual, costo total, intereses, costo anual, TAE estimada, impacto FIRE y datos faltantes;
* el dashboard muestra carga de deuda confirmada;
* se evita doble conteo separando cuota mensual, costo total y patrimonio.

Mejora implementada:
La deuda confirmada muestra presión sobre margen mensual y advierte cuando compromete libertad de decisión.

---

### v1.6.0 Cartera Objetivo - cerrado

Objetivo:
Mostrar asignación patrimonial simple.

Incluir:

* ETF USA;
* ETF Europa;
* Emergentes;
* Oro;
* Bitcoin;
* Bienes raíces.

Mostrar:

* objetivo;
* actual;
* desbalance;
* sobrepeso;
* bajo peso;
* alineado.

Estado:

* panel agregado al dashboard;
* objetivos editables por clase de activo;
* actual manual o derivado de inversiones confirmadas compatibles;
* advertencia cuando los objetivos no suman 100%;
* desbalance y estado por clase sin recomendación financiera.

Mejora implementada:
La cartera incluye política personal de inversión editable para que no sea solo porcentajes, sino reglas.

---

## Próximas versiones recomendadas

## v1.6.1 Navegación y Captura Premium - cerrado

Objetivo:
Corregir la estructura vertical excesiva de la app y hacer que cada área se sienta como una sección dedicada.

Problema actual:
La app concentra demasiados módulos en una página larga. Esto reduce claridad, hace que los paneles importantes queden enterrados y debilita la sensación de producto serio.

Implementar:

* navegación real por secciones;
* dashboard como vista principal resumida;
* pantalla dedicada de notas/captura;
* pantalla dedicada de decisiones;
* pantalla dedicada de cartera;
* pantalla dedicada de deuda;
* pantalla dedicada de roadmap;
* pantalla dedicada de macro;
* pantalla dedicada de configuración.

Estado:

* navegación interna por secciones implementada;
* dashboard convertido en resumen operativo;
* notas/captura, cartera, deuda y configuración separadas en vistas dedicadas;
* decisiones, roadmap y macro tienen pantallas reservadas para los siguientes módulos;
* editor de notas agrandado para captura prolongada;
* bug de IDs duplicados en vistas por hash corregido;
* verificado en desktop y mobile sin overflow horizontal.

Mejoras UI:

* agrandar el cuadro de notas;
* reducir textos largos dentro de tarjetas;
* priorizar jerarquía visual;
* usar cards compactas;
* evitar que todos los paneles compitan al mismo nivel;
* mantener tono sobrio, premium y calmado.

Criterio de éxito:
El usuario debe poder abrir la app y entender en menos de 10 segundos:

* cómo está su libertad financiera;
* qué decisión requiere atención;
* cuál es el próximo hito;
* qué acción debe hacer esta semana.

---

## v1.7.0 Roadmap Patrimonial - cerrado

Objetivo:
Mostrar el camino completo hacia la libertad financiera como una secuencia de hitos patrimoniales.

Hitos iniciales:

* US$50.000 invertidos;
* primer inmueble;
* 5 propiedades;
* US$500.000 de patrimonio;
* retiro parcial del 5% anual;
* US$1.000.000 de patrimonio.

Mostrar:

* progreso hacia cada hito;
* distancia en dólares;
* porcentaje completado;
* fecha estimada de llegada;
* aporte mensual actual;
* simulación con mayor aporte;
* impacto de compras grandes sobre el hito;
* próximo hito prioritario.

Ejemplos de copy:

* "Te faltan US$12.400 para llegar al hito US$50k."
* "Con tu aporte actual, llegarías en 18 meses."
* "Esta compra retrasa tu hito principal aproximadamente 1,7 meses."

Reglas:

* usar solo datos confirmados para progreso real;
* separar simulaciones de realidad;
* no prometer rentabilidades;
* permitir supuestos editables.

Archivos/modelos esperados:

* `WealthMilestone`;
* `RoadmapProjection`;
* `MilestoneProgress`;
* tests de cálculo de progreso y fechas estimadas.

Estado:

* modelo `WealthMilestone` agregado;
* modelo `RoadmapProjection` agregado;
* modelo `MilestoneProgress` agregado;
* progreso, distancia, porcentaje y meses estimados calculados por hito;
* próximo hito prioritario visible;
* simulación de mayor aporte separada del progreso real;
* gastos confirmados expresados como retraso aproximado sobre el hito;
* pantalla dedicada de Roadmap implementada;
* tests de cálculo agregados.

---

## v1.7.5 Sistema Semanal de Ejecución

Objetivo:
Convertir la app en un sistema de disciplina financiera, no solo en un panel informativo.

Principio:
No depender de motivación ni fuerza de voluntad. La app debe forzar revisión, separación de dinero y acción concreta.

Checklist semanal:

* revisar ingresos confirmados;
* revisar gastos confirmados;
* revisar tasa de ahorro;
* confirmar si se separó el 5% para colchón;
* confirmar inversión/aporte del mes;
* detectar compras emocionales;
* detectar comparación, FOMO o impulso;
* revisar deuda nueva;
* revisar avance del roadmap;
* definir una acción financiera concreta para la semana.

Mostrar:

* semana en curso;
* estado: pendiente, incompleto o cumplido;
* score de ejecución semanal;
* acciones atrasadas;
* recomendación práctica única.

Ejemplos de acciones:

* "Separar US$25 al colchón."
* "Revisar gasto de transporte."
* "Esperar 48 horas antes de confirmar esta compra."
* "Aplicar regla 70/20/10 al aumento detectado."

Reglas:

* no convertir el score en gamificación infantil;
* mantener tono serio;
* mostrar consecuencia, no culpa;
* permitir semanas imperfectas sin romper el sistema.
---

## v1.8.0 Modo Decisión

Objetivo:
Evaluar decisiones financieras antes de ejecutarlas.

Entrada:
El usuario escribe en lenguaje natural una posible decisión.

Ejemplos:

* "Quiero comprar un iPhone de US$900 en 12 cuotas."
* "Estoy pensando en cambiar el auto."
* "Me ofrecieron un préstamo."
* "Quiero invertir US$500 en BTC."
* "Quiero alquilar algo más caro."

Detectar:

* monto;
* cuotas;
* deuda;
* interés;
* TAE estimada;
* impacto mensual;
* impacto FIRE;
* impacto roadmap;
* tipo de decisión;
* activo o pasivo;
* señales emocionales;
* datos faltantes.

Mostrar:

* decisión detectada;
* costo real;
* impacto en margen mensual;
* impacto en libertad financiera;
* impacto en hito patrimonial;
* riesgo bajo, medio o alto;
* checklist anti-error;
* acción sugerida.

Acciones posibles:

* confirmar como gasto real;
* guardar como intención;
* esperar 48 horas;
* convertir en meta;
* descartar;
* pedir más datos.

Reglas:

* no dar asesoramiento financiero determinista;
* no decir "comprá" o "vendé";
* mostrar consecuencias y fricciones;
* proteger al usuario de actuar por impulso.

---

## v1.9.0 Política Personal de Inversión

Objetivo:
Definir reglas fijas para invertir y evitar cambios impulsivos de estrategia.

Incluir:

* aporte mensual objetivo;
* porcentaje de salario a invertir;
* fondo de emergencia objetivo;
* cartera objetivo;
* tolerancia a desbalance;
* frecuencia de rebalanceo;
* regla ante caídas fuertes;
* regla ante subidas fuertes;
* regla para BTC;
* regla para oro;
* regla para acciones individuales;
* regla para inmuebles;
* regla para no tocar el plan.

Puntos a resolver:

* oro físico, ETF con réplica física o estrategia mixta;
* BTC directo o no;
* cuándo permitir acciones individuales;
* cuándo revisar la cartera;
* cuándo una decisión requiere esperar 48 horas.

Mostrar:

* política activa;
* reglas cumplidas;
* reglas violadas;
* cambios recientes;
* fecha de última revisión.

Reglas:

* la política debe ser editable;
* cualquier cambio importante debe requerir confirmación;
* no permitir cambiar la política en caliente por pánico o FOMO sin advertencia;
* separar plan de inversión de opinión macro.

---

## v2.0.0 Margen Financiero

Objetivo:
Medir libertad real mensual, no solo patrimonio.

La libertad financiera no es solo patrimonio total. También es margen, tranquilidad y capacidad de decir no.

Medir:

* meses de colchón;
* gastos fijos mensuales;
* gastos variables;
* deuda mensual;
* ingreso libre;
* tasa de ahorro;
* presión de deuda;
* dependencia del siguiente sueldo;
* capacidad de cambiar de trabajo;
* distancia al punto de tranquilidad.

Mostrar:

* margen mensual disponible;
* meses cubiertos por el colchón;
* presión de deuda sobre ingreso;
* gastos esenciales vs no esenciales;
* estado general: frágil, ajustado, estable o fuerte.

Ejemplos de copy:

* "Tu margen actual es ajustado: dependés demasiado del siguiente sueldo."
* "Tu colchón cubre 2,4 meses de gastos."
* "Tu deuda consume el 18% de tus ingresos confirmados."

Reglas:

* no usar estimaciones como datos reales;
* permitir supuestos separados;
* conectar con deuda, gastos y roadmap;
* priorizar claridad sobre detalle contable.

---

## v2.1.0 Reglas de Aumentos e Ingresos Extra

Objetivo:
Evitar que aumentos de ingresos se conviertan automáticamente en más gasto.

Detectar:

* aumento de salario;
* ingreso extra;
* bono;
* aguinaldo;
* cobro inesperado;
* mejora de ingresos respecto al mes anterior.

Mostrar:

* aumento detectado;
* cuánto se absorbió en gasto;
* propuesta 70/20/10;
* monto sugerido para inversión;
* monto sugerido para mejora de vida;
* monto sugerido para gusto personal;
* impacto sobre roadmap.

Reglas:

* el usuario puede editar porcentajes;
* la app no debe asumir que todo aumento debe invertirse;
* debe proteger contra inflación del estilo de vida;
* debe permitir disfrutar sin destruir el plan.

---

## v2.2.0 Revisión Mensual

Objetivo:
Cerrar cada mes con diagnóstico financiero claro.

Mostrar:

* ingresos del mes;
* gastos del mes;
* tasa de ahorro;
* inversión realizada;
* deuda agregada o reducida;
* compras grandes;
* errores evitados;
* avance del roadmap;
* cambio en cartera;
* cambio en margen financiero;
* acción principal del mes siguiente.

Estados:

* mes fuerte;
* mes correcto;
* mes débil;
* mes de alerta.

Reglas:

* no juzgar moralmente;
* mostrar causa y consecuencia;
* siempre terminar con una acción concreta;
* separar realidad confirmada de hipótesis.

---

## Riesgos de producto

* mezclar datos confirmados con estimaciones;
* convertir la app en un dashboard genérico;
* agregar trading antes que hábitos financieros;
* sobrecargar el parser;
* perder el foco en claridad, margen y libertad financiera;
* hacer que la macro domine la conducta;
* usar demasiados gráficos sin acción práctica;
* convertir el producto en una app de ansiedad financiera;
* esconder la captura rápida detrás de demasiadas pantallas;
* permitir que decisiones futuras entren como gastos reales.

## Reglas generales de implementación

Implementar un módulo por vez.

Antes de cada módulo definir:

* diagnóstico;
* modelo de datos mínimo;
* casos de prueba;
* archivos afectados;
* copy principal;
* estados vacíos;
* comportamiento mobile;
* criterio de confirmación;
* qué cuenta como dato real y qué cuenta como simulación.

Cada módulo debe responder:

* qué problema evita;
* qué decisión mejora;
* qué dato usa;
* qué acción produce;
* qué riesgo de confusión puede generar.

## Prioridad recomendada

1. v1.7.5 Sistema Semanal de Ejecución.
2. v1.8.0 Modo Decisión.
3. v1.9.0 Política Personal de Inversión.
4. v2.0.0 Margen Financiero.
5. v2.1.0 Reglas de Aumentos e Ingresos Extra.
6. v2.2.0 Revisión Mensual.
