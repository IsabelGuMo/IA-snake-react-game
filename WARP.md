# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Comandos de desarrollo

### Instalación de dependencias

- Instalar dependencias del proyecto:
  - `npm install`

### Ciclo de desarrollo

- Levantar servidor de desarrollo (Vite con React y HMR):
  - `npm run dev`
- Construir versión de producción:
- Servir _preview_ de la build de producción (útil para depuración de issues específicos de build):
  - `npm run preview`

### Linting

- Ejecutar linter:
  - `npm run lint`

### Tests

- Actualmente **no hay configuración de tests ni script `test` en `package.json`**. Para añadir pruebas, configura un runner (por ejemplo Vitest o Jest) y define los scripts correspondientes (por ejemplo `"test"`, `"test:watch"`) antes de intentar ejecutar tests desde Warp.

## Arquitectura y estructura de alto nivel

### Stack y tooling

- **Framework**: React (modo `StrictMode`, React 18+ API) con JSX.
- **Empaquetador/dev server**: Vite (`vite.config.js`) con `@vitejs/plugin-react`.
- **Linting**: ESLint flat config (`eslint.config.js`) con:
  - `@eslint/js` (reglas recomendadas de JS).
  - `eslint-plugin-react-hooks` (reglas de Hooks de React).
  - `eslint-plugin-react-refresh` (integración con Vite/React Fast Refresh).
- **Regla personalizada relevante**: `no-unused-vars` ignora variables cuyo nombre empieza por mayúscula o guion bajo (`varsIgnorePattern: '^[A-Z_]'`). Si ves advertencias de ESLint, prioriza alinearte con esta configuración.

### Estructura principal del código

- `src/main.jsx`
  - Punto de entrada de la app.
  - Crea el _root_ de React con `createRoot(document.getElementById('root'))`.
  - Envuelve la app en `<StrictMode>` y renderiza `<App />`.
  - Importa los estilos globales de `src/index.css`.

- `src/App.jsx`
  - Componente raíz que implementa **todo el juego de Snake**.
  - Define constantes de juego:
    - `BOARD_SIZE`: tamaño del tablero cuadrado (20×20).
    - `INITIAL_SNAKE`: posición inicial de la serpiente (tres segmentos en línea).
    - `INITIAL_DIRECTION`: dirección inicial (derecha).
    - `TICK_MS`: intervalo de actualización del juego (150 ms).
  - Estado principal (via `useState`):
    - `snake`: array de segmentos `{ x, y }` ordenados de cabeza a cola.
    - `direction`: vector `{ x, y }` de movimiento actual.
    - `food`: celda `{ x, y }` actual de la comida.
    - `isRunning`: controla si el juego está corriendo o en pausa.
    - `score`: puntuación actual.
  - Helpers puros:
    - `getRandomFood(snake)`: genera una posición aleatoria de comida dentro del tablero que **no colisione con la serpiente** (usa un bucle `while` y comprueba con `some`).
    - `areEqual(a, b)`: utilidad para comparar posiciones `{ x, y }`.
  - Gestión de input de usuario (`useEffect` sin dependencias):
    - Añade un _event listener_ global a `window` para `keydown`.
    - Soporta teclas: `ArrowUp`, `ArrowDown`, `ArrowLeft`, `ArrowRight`, espacio (`' '`) y `Enter`.
    - Espacio/Enter activan **pausa/reanudación** (`isRunning`).
    - Las flechas actualizan la `direction` respetando la regla de **no girar 180º en un solo paso** (se comprueba que la nueva dirección no sea opuesta a la actual).
  - Bucle de juego (`useEffect` dependiente de `[direction, isRunning, food]`):
    - Si `isRunning` es falso, no se configura el intervalo.
    - Usa `setInterval` cada `TICK_MS` para actualizar `snake` mediante `setSnake(prevSnake => ...)`:
      - Calcula una nueva cabeza `newHead` sumando la `direction` a la posición actual.
      - Detecta **salida de límites** (`outOfBounds`) comparando `newHead` con `BOARD_SIZE`.
      - Detecta **colisión consigo misma** (`hitSelf`) comprobando si algún segmento coincide con `newHead`.
      - En caso de colisión:
        - Marca `isRunning` como `false`.
        - Devuelve el `prevSnake` sin modificar (la serpiente se queda en su última posición válida).
      - Si no hay colisión:
        - Construye `newSnake = [newHead, ...prevSnake]`.
        - Si `newHead` coincide con `food` (`areEqual`):
          - Incrementa `score`.
          - Genera nueva comida con `getRandomFood(newSnake)`.
          - Devuelve `newSnake` completo (la serpiente **crece**).
        - Si no hay comida en la nueva posición:
          - Elimina el último segmento (`newSnake.pop()`) para simular movimiento sin crecimiento.
    - Devuelve una función de limpieza que hace `clearInterval(id)` para evitar intervalos huérfanos cuando cambian dependencias o se desmonta el componente.
  - Renderizado del tablero:
    - Construye una lista `cells` recorriendo todas las coordenadas `x, y` del tablero.
    - Usa un `Set` de claves `"x-y"` para saber si una celda pertenece a la serpiente (`snakeSet`).
    - Calcula `foodKey` para saber dónde está la comida.
    - Para cada celda crea un `<div>` con clases condicionales:
      - `cell` (base).
      - `cell-snake` si la celda está en el cuerpo de la serpiente.
      - `cell-snake-head` si es la cabeza.
      - `cell-food` si es la comida.
    - El contenedor `.board` usa CSS Grid con `gridTemplateColumns: repeat(BOARD_SIZE, 1fr)` para generar un tablero cuadrado dinámico.
  - UI adicional:
    - Muestra la puntuación, botón de reinicio y un texto de ayuda con los controles.
    - `handleReset` reinicia todos los estados a sus valores iniciales y vuelve a arrancar el juego.
    - Cuando `!isRunning`, renderiza un overlay `.overlay` con mensaje de _"Juego terminado"_.

- `src/App.css`
  - Estilos específicos de la vista de Snake:
    - Disposición general (`.snake-app`, `.info`).
    - Tablero cuadrado responsivo con `.board` (usa `aspect-ratio: 1/1`).
    - Apariencia de las celdas (`.cell`, `.cell-snake`, `.cell-snake-head`, `.cell-food`).
    - Overlay semitransparente al terminar la partida (`.overlay`, `.overlay-content`).

- `src/index.css`
  - Estilos globales: tipografía base, `body`, estilos de `button` y `a`, y temas claro/oscuro mediante `prefers-color-scheme`.

- `vite.config.js`
  - Configuración mínima de Vite:
    - `defineConfig({ plugins: [react()] })` con `@vitejs/plugin-react`.
  - Si necesitas cambiar paths de build, alias o servidor, este es el lugar principal para hacerlo.

- `eslint.config.js`
  - Configuración flat basada en `defineConfig` con un array de bloques.
  - Ignora globalmente `dist`.
  - Aplica reglas a `**/*.{js,jsx}` con entorno navegador y soporte para JSX.
  - Importante al modificar/añadir archivos JS/JSX:
    - Mantener la estructura de `files`/`languageOptions`/`rules` si amplías la configuración.

## Notas para futuras extensiones

- Si amplías la lógica del juego (niveles, velocidad variable, obstáculos), procura mantener las actualizaciones de estado **localizadas en los callbacks de `setState`** (`setSnake`, `setScore`, etc.) para evitar condiciones de carrera entre renders.
- Cambiar `BOARD_SIZE` afecta a:
  - Dimensión del tablero.
  - Rango de coordenadas válidas usadas por `getRandomFood` y la detección de colisiones.
- Si introduces nuevos tipos de entidades en el tablero (por ejemplo obstáculos), considera representarlas también como colecciones de `{ x, y }` y reutilizar helpers como `areEqual` y el esquema de claves `"x-y"` para mantener la consistencia.
