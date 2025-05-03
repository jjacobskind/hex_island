import React, { createContext, useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'

export const SocketContext = createContext()

export const SocketProvider = ({ children }) => {
  const [connected, setConnected] = useState(false)
  const socketRef = useRef(null)

  useEffect(() => {
    // Connect to the same host from which the app is served
    const socket = io() 
    socketRef.current = socket

    socket.on('connect', () => {
      setConnected(true)
    })

    socket.on('disconnect', () => {
      setConnected(false)
    })

    return () => {
      socket.disconnect()
    }
  }, [])

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, connected }}>
      {children}
    </SocketContext.Provider>
  )
}