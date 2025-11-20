import { useEffect, useState } from 'react'
import './App.css'

const BOARD_SIZE = 20
const INITIAL_SNAKE = [
  { x: 8, y: 10 },
  { x: 7, y: 10 },
  { x: 6, y: 10 },
]
const INITIAL_DIRECTION = { x: 1, y: 0 } // derecha
const TICK_MS = 150

function getRandomFood(snake) {
  while (true) {
    const x = Math.floor(Math.random() * BOARD_SIZE)
    const y = Math.floor(Math.random() * BOARD_SIZE)
    const onSnake = snake.some((segment) => segment.x === x && segment.y === y)
    if (!onSnake) return { x, y }
  }
}

function areEqual(a, b) {
  return a.x === b.x && a.y === b.y
}

function App() {
  const [snake, setSnake] = useState(INITIAL_SNAKE)
  const [direction, setDirection] = useState(INITIAL_DIRECTION)
  const [food, setFood] = useState(() => getRandomFood(INITIAL_SNAKE))
  const [isRunning, setIsRunning] = useState(true)
  const [score, setScore] = useState(0)

  useEffect(() => {
    function handleKeyDown(event) {
      if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'Enter'].includes(event.key)) {
        return
      }

      if (event.key === ' ' || event.key === 'Enter') {
        // Pausa / reanudar
        setIsRunning((prev) => !prev)
        return
      }

      setDirection((current) => {
        const dirMap = {
          ArrowUp: { x: 0, y: -1 },
          ArrowDown: { x: 0, y: 1 },
          ArrowLeft: { x: -1, y: 0 },
          ArrowRight: { x: 1, y: 0 },
        }
        const next = dirMap[event.key]
        // Evitar girar 180º directamente
        if (current.x + next.x === 0 && current.y + next.y === 0) {
          return current
        }
        return next
      })
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    if (!isRunning) return

    const id = setInterval(() => {
      setSnake((prevSnake) => {
        const head = prevSnake[0]
        const newHead = {
          x: head.x + direction.x,
          y: head.y + direction.y,
        }

        // Colisión con paredes
        const outOfBounds =
          newHead.x < 0 ||
          newHead.x >= BOARD_SIZE ||
          newHead.y < 0 ||
          newHead.y >= BOARD_SIZE

        // Colisión con el propio cuerpo
        const hitSelf = prevSnake.some((segment) => areEqual(segment, newHead))

        if (outOfBounds || hitSelf) {
          // Reiniciar partida
          setIsRunning(false)
          return prevSnake
        }

        const newSnake = [newHead, ...prevSnake]

        // Comer comida
        if (areEqual(newHead, food)) {
          setFood(getRandomFood(newSnake))
          setScore((s) => s + 1)
          return newSnake // crece
        } else {
          newSnake.pop() // avanzar sin crecer
          return newSnake
        }
      })
    }, TICK_MS)

    return () => clearInterval(id)
  }, [direction, isRunning, food])

  const handleReset = () => {
    setSnake(INITIAL_SNAKE)
    setDirection(INITIAL_DIRECTION)
    setFood(getRandomFood(INITIAL_SNAKE))
    setScore(0)
    setIsRunning(true)
  }

  const cells = []
  const snakeSet = new Set(snake.map((segment) => `${segment.x}-${segment.y}`))
  const foodKey = `${food.x}-${food.y}`

  for (let y = 0; y < BOARD_SIZE; y++) {
    for (let x = 0; x < BOARD_SIZE; x++) {
      const key = `${x}-${y}`
      const isHead = snake.length && snake[0].x === x && snake[0].y === y
      const isSnake = snakeSet.has(key)
      const isFood = key === foodKey

      cells.push(
        <div
          key={key}
          className={[
            'cell',
            isSnake ? 'cell-snake' : '',
            isHead ? 'cell-snake-head' : '',
            isFood ? 'cell-food' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        />,
      )
    }
  }

  return (
    <div className="snake-app">
      <h1>Snake en React</h1>
      <div className="info">
        <span>Puntuación: {score}</span>
        <button onClick={handleReset}>Reiniciar</button>
        <span className="hint">Usa las flechas del teclado. Espacio/Enter: Pausa.</span>
      </div>
      <div className="board" style={{ gridTemplateColumns: `repeat(${BOARD_SIZE}, 1fr)` }}>
        {cells}
        {!isRunning && (
          <div className="overlay">
            <div className="overlay-content">
              <h2>Juego terminado</h2>
              <p>Pulsa "Reiniciar" o la tecla Enter para jugar de nuevo.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
