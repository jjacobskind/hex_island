// NOTE: Probably don't need this

import React, { useContext } from 'react'
import { ToastContext } from '../context/toast_context'
import './toast.css' // optional styling

const Toast = () => {
  const { toasts, removeToast } = useContext(ToastContext)

  return (
    <div className="toast-container">
      {toasts.map(toast => (
        <div key={toast.id} className={`toast toast-${toast.type}`}>
          <span>{toast.message}</span>
          <button onClick={() => removeToast(toast.id)}>✕</button>
        </div>
      ))}
    </div>
  )
}

export default Toast