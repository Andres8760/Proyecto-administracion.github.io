import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'

vi.mock('@/services/api', () => ({ default: { get: vi.fn(), post: vi.fn() } }))

import api from '@/services/api'
import RegistroView from '@/views/RegistroView.vue'

const vacia = { render: () => null }
const equipos = [
  { id: 1, nombre: 'Junior' },
  { id: 2, nombre: 'Millonarios' },
]

async function montar() {
  const pinia = createPinia()
  setActivePinia(pinia)
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/registro', component: RegistroView },
      { path: '/login', component: vacia },
      { path: '/perfil', component: vacia },
    ],
  })
  await router.push('/registro')
  await router.isReady()
  const wrapper = mount(RegistroView, { global: { plugins: [pinia, router] } })
  await flushPromises()
  return { wrapper, router }
}

async function llenar(wrapper, { password = 'clave12345', confirmar = 'clave12345' } = {}) {
  const [clave, repetir] = wrapper.findAll('input[type=password]')
  await wrapper.find('input[type=text]').setValue('Ana Pérez')
  await wrapper.find('input[type=email]').setValue('ana@correo.com')
  await wrapper.find('select').setValue('2')
  await clave.setValue(password)
  await repetir.setValue(confirmar)
  await wrapper.find('form').trigger('submit')
  await flushPromises()
}

describe('RegistroView', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.resetAllMocks()
    api.get.mockImplementation(async (url) => {
      if (url === '/equipos') return { data: equipos }
      if (url === '/auth/me') return { data: { id: 7, rol: 'hincha', equipo_id: 2 } }
      throw new Error(`GET inesperado: ${url}`)
    })
  })

  it('carga los equipos en la lista desplegable', async () => {
    const { wrapper } = await montar()
    const opciones = wrapper.findAll('select option').map((o) => o.text())
    expect(opciones).toEqual(['Elige tu equipo', 'Junior', 'Millonarios'])
  })

  it('rechaza una contraseña de menos de 8 caracteres', async () => {
    const { wrapper } = await montar()
    await llenar(wrapper, { password: 'corta', confirmar: 'corta' })
    expect(wrapper.find('.error').text()).toBe('La contraseña debe tener mínimo 8 caracteres')
    expect(api.post).not.toHaveBeenCalled()
  })

  it('rechaza contraseñas que no coinciden', async () => {
    const { wrapper } = await montar()
    await llenar(wrapper, { password: 'clave12345', confirmar: 'otraClave99' })
    expect(wrapper.find('.error').text()).toBe('Las contraseñas no coinciden')
    expect(api.post).not.toHaveBeenCalled()
  })

  it('envía los datos y lleva al perfil cuando todo está bien', async () => {
    api.post.mockResolvedValue({ data: { token: 'nuevo' } })
    const { wrapper, router } = await montar()
    await llenar(wrapper)

    expect(api.post).toHaveBeenCalledWith('/auth/registro', {
      nombre: 'Ana Pérez',
      email: 'ana@correo.com',
      password: 'clave12345',
      equipo_id: 2,
    })
    expect(router.currentRoute.value.path).toBe('/perfil')
  })

  it('muestra el error del servidor, por ejemplo un correo repetido', async () => {
    api.post.mockRejectedValue({ response: { data: { error: 'Ese correo ya está registrado' } } })
    const { wrapper } = await montar()
    await llenar(wrapper)
    expect(wrapper.find('.error').text()).toBe('Ese correo ya está registrado')
  })
})