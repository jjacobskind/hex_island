import React, { useContext, useEffect } from 'react'
import { AuthContext } from '../context/auth_context'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/navbar'
import Board from '../components/board'
import PlayerInfo from '../components/player_info'
import './game.css'

const GamePage = () => {
  const { isLoggedIn } = useContext(AuthContext)
  const navigate = useNavigate()

  useEffect(() => {
    if (!isLoggedIn()) {
      navigate('/login')
    }
  }, [isLoggedIn, navigate])

  return (
    <div className="game-layout">
      <Navbar />
      <div className="game-content">
        <PlayerInfo />
        <Board />
      </div>
    </div>
  )
}

export default GamePage