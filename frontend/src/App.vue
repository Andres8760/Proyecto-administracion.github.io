<script setup>
import { RouterLink, RouterView, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
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
        <RouterLink to="/perfil">Mi perfil</RouterLink>
        <button class="enlace" @click="salir">Salir</button>
      </template>
      <template v-else>
        <RouterLink to="/login">Entrar</RouterLink>
        <RouterLink to="/registro">Registrarme</RouterLink>
      </template>
    </nav>
  </header>

  <main class="contenedor">
    <RouterView />
  </main>
</template>