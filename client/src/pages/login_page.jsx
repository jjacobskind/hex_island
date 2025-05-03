import React, { useState, useContext } from 'react'
import { AuthContext } from '../context/auth_context'
import { useNavigate } from 'react-router-dom'
import './login.css' // optional styling

const LoginPage = () => {
  const { login } = useContext(AuthContext)
  const [user, setUser] = useState({ username: '', password: '' })
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await login(user)
      navigate('/')
    } catch (err) {
      setError('Invalid credentials')
    }
  }

  return (
    <div className="login-container">
      <form onSubmit={handleSubmit}>
        <input 
          type="text" 
          value={user.username}
          onChange={(e) => setUser({ ...user, username: e.target.value })}
          placeholder="Username"
        />
        <input 
          type="password" 
          value={user.password}
          onChange={(e) => setUser({ ...user, password: e.target.value })}
          placeholder="Password"
        />
        <button type="submit">Login</button>
        {error && <div className="error-message">{error}</div>}
      </form>
    </div>
  )
}

export default LoginPage