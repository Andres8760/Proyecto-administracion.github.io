<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const email = ref('')
const password = ref('')
const error = ref('')
const cargando = ref(false)

async function enviar() {
  error.value = ''
  cargando.value = true
  try {
    await auth.login(email.value, password.value)
    router.push(String(route.query.redirect || '/perfil'))
  } catch (e) {
    error.value = e.response?.data?.error || 'No se pudo conectar con el servidor'
  } finally {
    cargando.value = false
  }
}
</script>

<template>
  <section class="tarjeta">
    <h1>Iniciar sesión</h1>
    <form @submit.prevent="enviar">
      <label>
        Correo
        <input v-model="email" type="email" autocomplete="email" required />
      </label>
      <label>
        Contraseña
        <input v-model="password" type="password" autocomplete="current-password" required />
      </label>
      <p v-if="error" class="error">{{ error }}</p>
      <button class="boton" :disabled="cargando">
        {{ cargando ? 'Entrando...' : 'Entrar' }}
      </button>
    </form>
    <p class="pie">¿No tienes cuenta? <RouterLink to="/registro">Regístrate</RouterLink></p>
  </section>
</template>