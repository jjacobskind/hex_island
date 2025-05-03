import React, { useContext, useEffect } from 'react'
import { AuthContext } from '../context/auth_context'
import { useNavigate } from 'react-router-dom'
import './landing.css' // optional styling

const LandingPage = () => {
  const { isLoggedIn } = useContext(AuthContext)
  const navigate = useNavigate()

  useEffect(() => {
    // If the original landing controller checked login status and redirected,
    // we can replicate that logic here.
    if (isLoggedIn()) {
      navigate('/game')
    }
  }, [isLoggedIn, navigate])

  return (
    <div className="landing-container">
      <h1>Welcome to Hex Island</h1>
      <p>Login or register to continue</p>
    </div>
  )
}

export default LandingPage