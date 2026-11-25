import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'

vi.mock('@/services/api', () => ({ default: { get: vi.fn(), post: vi.fn() } }))

import api from '@/services/api'
import LoginView from '@/views/LoginView.vue'

const vacia = { render: () => null }

async function montar() {
  const pinia = createPinia()
  setActivePinia(pinia)
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: vacia },
      { path: '/login', component: LoginView },
      { path: '/registro', component: vacia },
      { path: '/perfil', component: vacia },
      { path: '/escaner', component: vacia },
      { path: '/admin', component: vacia },
    ],
  })
  await router.push('/login')
  await router.isReady()
  const wrapper = mount(LoginView, { global: { plugins: [pinia, router] } })
  return { wrapper, router }
}

async function llenarYEnviar(wrapper) {
  await wrapper.find('input[type=email]').setValue('ana@correo.com')
  await wrapper.find('input[type=password]').setValue('clave12345')
  await wrapper.find('form').trigger('submit')
  await flushPromises()
}

describe('LoginView', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.resetAllMocks()
  })

  it('muestra el título y el enlace a registro', async () => {
    const { wrapper } = await montar()
    expect(wrapper.find('h1').text()).toBe('Iniciar sesión')
    expect(wrapper.find('a[href="/registro"]').exists()).toBe(true)
  })

  it('muestra el error que devuelve el servidor', async () => {
    api.post.mockRejectedValue({ response: { data: { error: 'Credenciales inválidas' } } })
    const { wrapper } = await montar()
    await llenarYEnviar(wrapper)
    expect(wrapper.find('.error').text()).toBe('Credenciales inválidas')
  })

  it('muestra un mensaje genérico si no hay conexión', async () => {
    api.post.mockRejectedValue(new Error('Network Error'))
    const { wrapper } = await montar()
    await llenarYEnviar(wrapper)
    expect(wrapper.find('.error').text()).toBe('No se pudo conectar con el servidor')
  })

  it('un administrador va al panel después de entrar', async () => {
    api.post.mockResolvedValue({ data: { token: 't' } })
    api.get.mockResolvedValue({ data: { id: 1, rol: 'administrador' } })
    const { wrapper, router } = await montar()
    await llenarYEnviar(wrapper)
    expect(router.currentRoute.value.path).toBe('/admin')
  })
})