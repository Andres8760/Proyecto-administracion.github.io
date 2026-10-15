import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/services/api'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token'))
  const usuario = ref(null)

  const estaLogueado = computed(() => !!token.value)
  const rol = computed(() => usuario.value?.rol ?? null)

  function guardarToken(t) {
    token.value = t
    localStorage.setItem('token', t)
  }

  async function cargarUsuario() {
    if (!token.value) return
    try {
      const { data } = await api.get('/auth/me')
      usuario.value = data
    } catch (e) {
      if (e.response?.status === 401) logout() // token vencido o inválido
      else console.error('No se pudo cargar el usuario', e)
    }
  }

  async function login(email, password) {
    const { data } = await api.post('/auth/login', { email, password })
    guardarToken(data.token)
    await cargarUsuario() // trae también el nombre del equipo
  }

  async function registro(datos) {
    const { data } = await api.post('/auth/registro', datos)
    guardarToken(data.token)
    await cargarUsuario()
  }

  function logout() {
    token.value = null
    usuario.value = null
    localStorage.removeItem('token')
  }

  return { token, usuario, estaLogueado, rol, cargarUsuario, login, registro, logout }
})