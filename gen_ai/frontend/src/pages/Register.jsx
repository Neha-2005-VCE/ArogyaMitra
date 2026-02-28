import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import useAuthStore from '../stores/authStore'
import toast from 'react-hot-toast'

export default function Register() {
  const navigate = useNavigate()
  const { register } = useAuthStore()
  const [form, setForm] = useState({
    email: '', username: '', password: '', full_name: ''
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await register(form)
      toast.success('Account created! 🎉')
      navigate('/health-assessment')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="bg-[#1a1a2e] border border-[#2a2a40] rounded-2xl p-8 w-full max-w-md">
        <h2 className="text-3xl font-bold text-white mb-2">Join ArogyaMitra 🚀</h2>
        <p className="text-gray-400 mb-6">Start your AI-powered fitness journey</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="text" placeholder="Full Name"
            value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})}
            className="w-full bg-[#0d0d14] border border-[#2a2a40] rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
          />
          <input type="email" placeholder="Email" required
            value={form.email} onChange={e => setForm({...form, email: e.target.value})}
            className="w-full bg-[#0d0d14] border border-[#2a2a40] rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
          />
          <input type="text" placeholder="Username" required
            value={form.username} onChange={e => setForm({...form, username: e.target.value})}
            className="w-full bg-[#0d0d14] border border-[#2a2a40] rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
          />
          <input type="password" placeholder="Password" required
            value={form.password} onChange={e => setForm({...form, password: e.target.value})}
            className="w-full bg-[#0d0d14] border border-[#2a2a40] rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
          />
          <button type="submit" disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-semibold transition disabled:opacity-50">
            {loading ? 'Creating account...' : 'Create Account →'}
          </button>
        </form>
        <p className="text-gray-400 text-center mt-4">
          Already have an account? <Link to="/login" className="text-purple-400 hover:underline">Login</Link>
        </p>
      </div>
    </div>
  )
}