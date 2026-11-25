import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

vi.mock('@/services/api', () => ({ default: { get: vi.fn(), post: vi.fn() } }))

import api from '@/services/api'
import { useAuthStore } from '@/stores/auth'

describe('store de autenticación', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    vi.resetAllMocks()
  })

  it('sin token no hay sesión y la ruta de inicio es el perfil', () => {
    const auth = useAuthStore()
    expect(auth.estaLogueado).toBe(false)
    expect(auth.rol).toBeNull()
    expect(auth.rutaInicio).toBe('/perfil')
  })

  it('login guarda el token y carga el usuario', async () => {
    api.post.mockResolvedValue({ data: { token: 'abc123' } })
    api.get.mockResolvedValue({ data: { id: 1, nombre: 'Ana', rol: 'hincha' } })

    const auth = useAuthStore()
    await auth.login('ana@correo.com', 'clave12345')

    expect(localStorage.getItem('token')).toBe('abc123')
    expect(auth.estaLogueado).toBe(true)
    expect(auth.rol).toBe('hincha')
  })

  it.each([
    ['funcionario', '/escaner'],
    ['administrador', '/admin'],
    ['hincha', '/perfil'],
  ])('el rol %s entra a %s', async (rol, ruta) => {
    api.post.mockResolvedValue({ data: { token: 't' } })
    api.get.mockResolvedValue({ data: { id: 1, rol } })

    const auth = useAuthStore()
    await auth.login('x@correo.com', 'clave12345')

    expect(auth.rutaInicio).toBe(ruta)
  })

  it('logout borra el token y el usuario', async () => {
    api.post.mockResolvedValue({ data: { token: 't' } })
    api.get.mockResolvedValue({ data: { id: 1, rol: 'hincha' } })

    const auth = useAuthStore()
    await auth.login('x@correo.com', 'clave12345')
    auth.logout()

    expect(auth.estaLogueado).toBe(false)
    expect(auth.usuario).toBeNull()
    expect(localStorage.getItem('token')).toBeNull()
  })

  it('un token vencido (401) cierra la sesión', async () => {
    localStorage.setItem('token', 'vencido')
    setActivePinia(createPinia())
    api.get.mockRejectedValue({ response: { status: 401 } })

    const auth = useAuthStore()
    await auth.cargarUsuario()

    expect(auth.estaLogueado).toBe(false)
    expect(localStorage.getItem('token')).toBeNull()
  })

  it('un error de red no cierra la sesión', async () => {
    localStorage.setItem('token', 'valido')
    setActivePinia(createPinia())
    api.get.mockRejectedValue(new Error('Network Error'))
    const silencio = vi.spyOn(console, 'error').mockImplementation(() => {})

    const auth = useAuthStore()
    await auth.cargarUsuario()

    expect(auth.estaLogueado).toBe(true)
    silencio.mockRestore()
  })
})