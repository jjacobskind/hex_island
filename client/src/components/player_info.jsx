import React, { useContext } from 'react'
import { GameContext } from '../context/game_context'
import './player-info.css'

const PlayerInfo = () => {
  const { player } = useContext(GameContext)

  if (!player) {
    return <div className="player-info-container">Loading player info...</div>
  }

  return (
    <div className="player-info-container">
      <h2>{player.username}</h2>
      <p>Score: {player.score}</p>
    </div>
  )
}

export default PlayerInfo