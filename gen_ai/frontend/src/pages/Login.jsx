import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import useAuthStore from '../stores/authStore'
import toast from 'react-hot-toast'

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuthStore()
  const [form, setForm] = useState({ username: '', password: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(form)
      toast.success('Welcome back! 🎉')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="bg-[#1a1a2e] border border-[#2a2a40] rounded-2xl p-8 w-full max-w-md">
        <h2 className="text-3xl font-bold text-white mb-2">Welcome Back 👋</h2>
        <p className="text-gray-400 mb-6">Login to continue your fitness journey</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text" placeholder="Username or Email"
            value={form.username} onChange={e => setForm({...form, username: e.target.value})}
            className="w-full bg-[#0d0d14] border border-[#2a2a40] rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
            required
          />
          <input
            type="password" placeholder="Password"
            value={form.password} onChange={e => setForm({...form, password: e.target.value})}
            className="w-full bg-[#0d0d14] border border-[#2a2a40] rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
            required
          />
          <button type="submit" disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-semibold transition disabled:opacity-50">
            {loading ? 'Logging in...' : 'Login →'}
          </button>
        </form>
        <p className="text-gray-400 text-center mt-4">
          Don't have an account? <Link to="/register" className="text-purple-400 hover:underline">Register</Link>
        </p>
      </div>
    </div>
  )
}