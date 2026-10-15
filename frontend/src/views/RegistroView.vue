<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'

const auth = useAuthStore()
const router = useRouter()

const equipos = ref([])
const nombre = ref('')
const email = ref('')
const password = ref('')
const confirmar = ref('')
const equipoId = ref('')
const error = ref('')
const cargando = ref(false)

onMounted(async () => {
  try {
    const { data } = await api.get('/equipos')
    equipos.value = data
  } catch {
    error.value = 'No se pudieron cargar los equipos'
  }
})

async function enviar() {
  error.value = ''
  if (password.value.length < 8) {
    error.value = 'La contraseña debe tener mínimo 8 caracteres'
    return
  }
  if (password.value !== confirmar.value) {
    error.value = 'Las contraseñas no coinciden'
    return
  }

  cargando.value = true
  try {
    await auth.registro({
      nombre: nombre.value,
      email: email.value,
      password: password.value,
      equipo_id: Number(equipoId.value),
    })
    router.push('/perfil')
  } catch (e) {
    error.value = e.response?.data?.error || 'No se pudo conectar con el servidor'
  } finally {
    cargando.value = false
  }
}
</script>

<template>
  <section class="tarjeta">
    <h1>Crear cuenta</h1>
    <form @submit.prevent="enviar">
      <label>
        Nombre
        <input v-model="nombre" type="text" autocomplete="name" required />
      </label>
      <label>
        Correo
        <input v-model="email" type="email" autocomplete="email" required />
      </label>
      <label>
        Tu equipo
        <select v-model="equipoId" required>
          <option value="" disabled>Elige tu equipo</option>
          <option v-for="e in equipos" :key="e.id" :value="e.id">{{ e.nombre }}</option>
        </select>
      </label>
      <label>
        Contraseña (mínimo 8 caracteres)
        <input v-model="password" type="password" autocomplete="new-password" required />
      </label>
      <label>
        Confirmar contraseña
        <input v-model="confirmar" type="password" autocomplete="new-password" required />
      </label>
      <p v-if="error" class="error">{{ error }}</p>
      <button class="boton" :disabled="cargando">
        {{ cargando ? 'Creando...' : 'Registrarme' }}
      </button>
    </form>
    <p class="pie">¿Ya tienes cuenta? <RouterLink to="/login">Inicia sesión</RouterLink></p>
  </section>
</template>