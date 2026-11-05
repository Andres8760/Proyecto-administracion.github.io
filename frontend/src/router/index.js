import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: () => import('@/views/HomeView.vue') },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { soloInvitado: true },
    },
    {
      path: '/registro',
      name: 'registro',
      component: () => import('@/views/RegistroView.vue'),
      meta: { soloInvitado: true },
    },
    {
      path: '/perfil',
      name: 'perfil',
      component: () => import('@/views/PerfilView.vue'),
      meta: { requiereAuth: true },
    },
    {
      path: '/ranking',
      name: 'ranking',
      component: () => import('@/views/RankingView.vue'),
      meta: { requiereAuth: true, ancho: true },
    },
    {
      path: '/escaner',
      name: 'escaner',
      component: () => import('@/views/EscanerView.vue'),
      meta: { requiereAuth: true, roles: ['funcionario'], ancho: true },
    },
    {
      path: '/admin',
      name: 'admin',
      component: () => import('@/views/AdminView.vue'),
      meta: { requiereAuth: true, roles: ['administrador'], ancho: true },
    },
  ],
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()

  // Si hay token guardado pero aún no cargamos el usuario (recarga de página)
  if (auth.token && !auth.usuario) await auth.cargarUsuario()

  if (to.meta.requiereAuth && !auth.estaLogueado) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  // RN-07: cada rol solo entra a sus pantallas
  if (to.meta.roles && !to.meta.roles.includes(auth.rol)) {
    return auth.rutaInicio
  }
  if (to.meta.soloInvitado && auth.estaLogueado) {
    return auth.rutaInicio
  }
})

export default router
