// NOTE: I probably don't need this file

import React, { createContext, useState, useCallback } from 'react'

export const ToastContext = createContext()

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, type = 'info') => {
    const newToast = { id: Date.now(), message, type }
    setToasts((prev) => [...prev, newToast])
  }, [])

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter(t => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
    </ToastContext.Provider>
  )
}