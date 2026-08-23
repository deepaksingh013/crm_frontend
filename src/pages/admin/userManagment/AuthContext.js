import React, { createContext, useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import Cookies from 'js-cookie'

const API_URL = 'https://crm-backend-5-iocr.onrender.com/api'

export const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const fetchUser = useCallback(async () => {
    const token = Cookies.get('token')
    if (!token) {
      setLoading(false)
      setUser(null)
      return
    }

    try {
      const response = await axios.get(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (response.data?.success && response.data?.user) {
        setUser(response.data.user)
      } else {
        throw new Error('Failed to fetch user')
      }
    } catch (error) {
      console.error('Auth fetch user error:', error)
      Cookies.remove('token')
      setUser(null)
      navigate('/login')
    } finally {
      setLoading(false)
    }
  }, [navigate])

  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  const login = (userData, token) => {
    Cookies.set('token', token, { expires: 7, secure: true, sameSite: 'lax' })
    setUser(userData)
    navigate('/users', { replace: true })
  }

  const logout = () => {
    Cookies.remove('token')
    setUser(null)
    navigate('/login', { replace: true })
  }

  const value = { user, loading, login, logout, fetchUser }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}