# v1.6.0 Cartera Objetivo Design Spec

## Diagnostico

Libertad OS ya muestra progreso FIRE, palancas, deuda confirmada e inflacion del estilo de vida usando datos base mas movimientos confirmados. El siguiente modulo debe agregar una lectura patrimonial simple sin convertir la app en trading ni en recomendacion financiera.

La cartera objetivo debe responder una pregunta acotada: como se compara mi asignacion actual contra una asignacion objetivo editable. La lectura debe mantenerse descriptiva, compacta y conectada con la regla sagrada de confirmacion manual: solo inversiones confirmadas pueden alimentar el actual derivado.

## Alcance

Construir un panel nuevo de "Cartera objetivo" en el dashboard principal. El panel incluye seis clases de activo:

- ETF USA
- ETF Europa
- Emergentes
- Oro
- Bitcoin
- Bienes raices

Cada clase muestra porcentaje objetivo editable, monto actual, fuente del monto actual, desbalance y estado. El usuario puede cargar valores manuales cuando no haya inversiones confirmadas suficientes.

## Modelo De Datos Minimo

Cada fila de cartera usa este modelo conceptual:

```ts
type PortfolioAssetClass =
  | "etf_usa"
  | "etf_europa"
  | "emergentes"
  | "oro"
  | "bitcoin"
  | "bienes_raices";

type PortfolioCurrentSource = "manual" | "derivado";

type PortfolioBalanceStatus = "sobrepeso" | "bajo_peso" | "alineado";

type TargetPortfolioAsset = {
  assetClass: PortfolioAssetClass;
  label: string;
  targetPercent: number;
  currentAmount: number;
  currentSource: PortfolioCurrentSource;
  imbalanceAmount: number;
  imbalancePercent: number;
  status: PortfolioBalanceStatus;
};
```

Campos:

- `assetClass`: identificador estable de la clase de activo.
- `targetPercent`: porcentaje objetivo editable.
- `currentAmount`: monto actual usado para la comparacion.
- `currentSource`: `manual` si viene del input del usuario, `derivado` si viene de inversiones confirmadas compatibles.
- `imbalanceAmount`: diferencia entre monto actual y monto esperado por objetivo.
- `imbalancePercent`: diferencia en puntos porcentuales entre porcentaje actual y objetivo.
- `status`: `sobrepeso`, `bajo_peso` o `alineado`.

## Reglas

- Los objetivos deben sumar 100%.
- Si los objetivos no suman 100%, mostrar advertencia visible pero no romper la UI ni bloquear la edicion.
- Las inversiones confirmadas pueden alimentar el monto actual cuando tengan categoria compatible con una clase de activo.
- Si no hay datos confirmados suficientes para una clase, permitir carga manual del monto actual.
- No mezclar inversiones no confirmadas, intenciones, pensamientos, negaciones, simulaciones ni sugerencias con la cartera actual.
- La fuente `derivado` solo se usa para transacciones con `type === "inversion"`, `intent === "real"` y `ignored !== true`.
- Si una clase tiene monto confirmado derivado mayor que cero, ese monto toma prioridad sobre el monto manual para esa clase.
- Si una clase no tiene monto derivado, se usa el monto manual guardado.
- El porcentaje actual se calcula como `currentAmount / totalCurrentAmount * 100`.
- El monto esperado se calcula como `totalCurrentAmount * targetPercent / 100`.
- `imbalanceAmount` es `currentAmount - expectedAmount`.
- `imbalancePercent` es `currentPercent - targetPercent`.
- El estado es `alineado` cuando `Math.abs(imbalancePercent) <= 2`; `sobrepeso` cuando es mayor a 2; `bajo_peso` cuando es menor a -2.
- Con cartera vacia, todos los montos quedan en 0 y el estado se muestra como `alineado` para evitar ruido falso.

## UI

El panel debe sentirse como parte del dashboard actual: sobrio, compacto, premium y de alta confianza.

Elementos:

- Titulo: `Cartera objetivo`.
- Explicacion breve: `Objetivo vs actual`.
- Copy aclaratorio: la lectura es descriptiva y no es recomendacion financiera.
- Indicador de suma objetivo: `100% objetivo` cuando esta correcto o advertencia cuando no suma 100%.
- Resumen compacto con total actual, cantidad de clases alineadas y principal desbalance.
- Filas por clase de activo con:
  - nombre de clase;
  - input de objetivo `%`;
  - input de monto manual cuando la fuente sea manual;
  - monto actual usado;
  - etiqueta de fuente `manual` o `derivado`;
  - barra simple de desbalance;
  - estado `sobrepeso`, `bajo peso` o `alineado`.

Restricciones visuales:

- Evitar estetica trading, crypto, gamificada o fintech generica.
- Usar barras simples, no graficos llamativos.
- No usar gradientes ni colores saturados como decoracion.
- Mantener contraste accesible y foco visible.
- No anidar tarjetas innecesarias; usar filas y bloques compactos.

## Persistencia

La configuracion editable se guarda en localStorage con una clave nueva para no tocar datos existentes:

```ts
const PORTFOLIO_STORAGE_KEY = "libertad-os-target-portfolio-v1";
```

Datos persistidos:

```ts
type TargetPortfolioSettings = {
  targets: Record<PortfolioAssetClass, number>;
  manualAmounts: Record<PortfolioAssetClass, number>;
};
```

No se eliminan ni migran claves existentes.

## Categorias Compatibles Para Derivar Actual

El parser debe clasificar inversiones reales con categorias compatibles cuando el texto lo permita:

- `ETF USA`: textos con `etf usa`, `s&p`, `sp500`, `voo`, `vti`, `qqq`.
- `ETF Europa`: textos con `etf europa`, `europa`, `vwcg`, `imeu`.
- `Emergentes`: textos con `emergentes`, `mercados emergentes`, `emerging`, `eem`, `iemg`.
- `Oro`: textos con `oro`, `gold`, `gld`.
- `Bitcoin`: textos con `bitcoin`, `btc`.
- `Bienes raices`: textos con `bienes raices`, `real estate`, `reits`, `reit`, `inmueble`, `propiedad`.

Cuando una inversion no matchee estas categorias, puede seguir como `inversion` general y no alimentar una clase especifica.

## Tests

Cubrir estos casos en `tests/parser-regression.ts` o tests equivalentes del proyecto:

- Objetivos que suman 100%: no muestran advertencia y calculan estados.
- Objetivos que no suman 100%: devuelven advertencia pero no fallan ni bloquean calculo.
- Cartera vacia: total actual 0, montos 0 y estados alineados.
- Inversion confirmada derivada: una transaccion real de inversion con categoria compatible alimenta el monto actual derivado.
- Monto manual: si no hay derivado para una clase, el monto manual alimenta el actual.
- Estados: sobrepeso, bajo peso y alineado segun tolerancia de 2 puntos porcentuales.

## Archivos Afectados

- `src/lib/finance.ts`: tipos y analizador de cartera objetivo.
- `src/lib/financial-notes.ts`: categorias compatibles para inversiones.
- `src/components/libertad-dashboard.tsx`: estado editable, persistencia y panel visual.
- `tests/parser-regression.ts`: casos de regresion para analisis de cartera y categorias derivadas.
- `ROADMAP.md`: marcar v1.6.0 como implementado cuando pase verificacion.
- `CHANGELOG.md`: agregar resumen de v1.6.0 cuando pase verificacion.

## Criterios De Aceptacion

- El dashboard muestra el panel de cartera objetivo con seis clases de activo.
- Los porcentajes objetivo son editables y persistentes.
- Los montos manuales son editables y persistentes.
- Las inversiones confirmadas compatibles alimentan el actual derivado.
- Las inversiones no confirmadas, intenciones, pensamientos, negaciones y simulaciones no alimentan la cartera actual.
- Si los objetivos no suman 100%, aparece una advertencia sin romper la UI.
- El panel muestra desbalance y estado por clase.
- El diseno mantiene el tono calmado, serio, premium y claro de Libertad OS.
- Pasan `npm run lint`, `npm run build` y `npm run test:parser`.

## Spec Self-Review

- Revision de huecos: no quedan secciones vacias ni marcadores pendientes.
- Consistencia: el modelo, las reglas, la UI y los tests usan los mismos nombres conceptuales.
- Alcance: es un solo modulo de dashboard con parser minimo para conectar datos confirmados.
- Ambiguedad resuelta: `alineado` usa tolerancia explicita de 2 puntos porcentuales; derivado tiene prioridad sobre manual solo cuando hay monto confirmado mayor que cero.
