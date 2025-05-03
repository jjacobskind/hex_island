import React, { useEffect, useState } from 'react'
import { generateBoard } from '../services/board_service'
import './board.css' // Import styles if needed; adjust path as necessary

const Board = () => {
  const [tiles, setTiles] = useState([])

  useEffect(() => {
    const initialTiles = generateBoard()
    setTiles(initialTiles)
  }, [])

  return (
    <div className="board">
      {tiles.map((tile, index) => (
        <div key={index} className="board-tile">
          <img src={tile.image} alt={tile.type} />
        </div>
      ))}
    </div>
  )
}

export default Board