import React, { createContext, useState, useEffect, useContext } from 'react'
import { AuthContext } from './auth_context'
import { API_BASE_URL } from '../config'

export const GameContext = createContext()

export const GameProvider = ({ children }) => {
  const { token } = useContext(AuthContext)
  const [player, setPlayer] = useState(null)

  useEffect(() => {
    const fetchPlayer = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/player`, {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          }
        })
        if (!response.ok) {
          throw new Error('Failed to fetch player data')
        }
        const data = await response.json()
        setPlayer(data)
      } catch (err) {
        console.error('Error fetching player info', err)
        setPlayer(null)
      }
    }

    // Only fetch player data if we have a token and are logged in
    // If the backend returns public data even without login, remove this check
    if (token) {
      fetchPlayer()
    } else {
      setPlayer(null)
    }
  }, [token])

  return (
    <GameContext.Provider value={{ player, setPlayer }}>
      {children}
    </GameContext.Provider>
  )
}