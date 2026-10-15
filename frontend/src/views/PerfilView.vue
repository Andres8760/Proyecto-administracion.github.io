<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()

function salir() {
  auth.logout()
  router.push('/')
}
</script>

<template>
  <section class="tarjeta">
    <h1>Mi perfil</h1>
    <dl v-if="auth.usuario">
      <dt>Nombre</dt>
      <dd>{{ auth.usuario.nombre }}</dd>
      <dt>Correo</dt>
      <dd>{{ auth.usuario.email }}</dd>
      <dt>Equipo</dt>
      <dd>{{ auth.usuario.equipo }}</dd>
      <dt>Rol</dt>
      <dd>{{ auth.usuario.rol }}</dd>
    </dl>
    <p v-else>Cargando...</p>
    <button class="boton secundario" @click="salir">Cerrar sesión</button>
  </section>
</template>