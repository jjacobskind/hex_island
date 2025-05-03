import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/auth_context'
import { ToastProvider } from './context/toast_context'
import { GameProvider } from './context/game_context'
import { SocketProvider } from './context/socket_context'
import LandingPage from './pages/landing_page'
import LoginPage from './pages/login_page'
import RegisterPage from './pages/register_page'
import GamePage from './pages/game_page'
import Toast from './components/toast'
import './styles/main.css'

const App = () => {
  return (
    <AuthProvider>
      <ToastProvider>
        <GameProvider>
          <SocketProvider>
            <Router>
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/game" element={<GamePage />} />
              </Routes>
              <Toast />
            </Router>
          </SocketProvider>
        </GameProvider>
      </ToastProvider>
    </AuthProvider>
  )
}

export default App