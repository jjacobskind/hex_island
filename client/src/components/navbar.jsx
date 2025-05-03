import React, { useContext } from 'react'
import { AuthContext } from '../context/auth_context'
import { Link, useNavigate } from 'react-router-dom'
import './navbar.css' // adjust path as needed

const Navbar = () => {
  const { user, logout } = useContext(AuthContext)
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav className="navbar">
      <div className="navbar-header">
        <Link className="navbar-brand" to="/">Hex Island</Link>
      </div>
      <ul className="nav navbar-nav navbar-right">
        {user ? (
          <li>
            <button onClick={handleLogout}>Logout</button>
          </li>
        ) : (
          <li>
            <Link to="/login">Login</Link>
          </li>
        )}
      </ul>
    </nav>
  )
}

export default Navbar