import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authApi } from '../services/api'

const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: async (credentials) => {
        const res = await authApi.login(credentials)
        set({
          token: res.data.access_token,
          user: res.data.user,
          isAuthenticated: true,
        })
        return res.data
      },

      register: async (data) => {
        const res = await authApi.register(data)
        set({
          token: res.data.access_token,
          user: res.data.user,
          isAuthenticated: true,
        })
        return res.data
      },

      logout: () => set({ user: null, token: null, isAuthenticated: false }),

      updateUser: (data) => set((state) => ({ user: { ...state.user, ...data } })),
    }),
    { name: 'arogyamitra-auth' }
  )
)

export default useAuthStore