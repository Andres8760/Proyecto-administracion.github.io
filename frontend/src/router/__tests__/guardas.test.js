import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('@/services/api', () => ({ default: { get: vi.fn(), post: vi.fn() } }))

import router from '@/router'

describe('guardas del router', () => {
  beforeEach(async () => {
    localStorage.clear()
    setActivePinia(createPinia())
    await router.push('/')
  })

  it('un invitado que pide /perfil es enviado al login con la ruta de retorno', async () => {
    await router.push('/perfil')
    expect(router.currentRoute.value.name).toBe('login')
    expect(router.currentRoute.value.query.redirect).toBe('/perfil')
  })

  it('un invitado que pide /admin es enviado al login', async () => {
    await router.push('/admin')
    expect(router.currentRoute.value.name).toBe('login')
  })
})