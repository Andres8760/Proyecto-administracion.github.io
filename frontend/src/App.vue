<script setup>
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

function salir() {
  auth.logout()
  router.push('/')
}
</script>

<template>
  <header class="barra">
    <RouterLink to="/" class="marca">♻️ FutCiclar</RouterLink>
    <nav>
      <template v-if="auth.estaLogueado">
        <RouterLink v-if="auth.rol === 'hincha'" to="/perfil">Mi perfil</RouterLink>
        <RouterLink v-if="auth.rol === 'funcionario'" to="/escaner">Escanear</RouterLink>
        <RouterLink v-if="auth.rol === 'administrador'" to="/admin">Panel</RouterLink>
        <RouterLink to="/ranking">Ranking</RouterLink>
        <span v-if="auth.rol && auth.rol !== 'hincha'" class="insignia">{{ auth.rol }}</span>
        <button class="enlace" @click="salir">Salir</button>
      </template>
      <template v-else>
        <RouterLink to="/login">Entrar</RouterLink>
        <RouterLink to="/registro">Registrarme</RouterLink>
      </template>
    </nav>
  </header>

  <main class="contenedor" :class="{ ancho: route.meta.ancho }">
    <RouterView />
  </main>
</template>
