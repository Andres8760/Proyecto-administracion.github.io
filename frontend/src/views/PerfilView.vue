<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import QRCode from 'qrcode'
import api from '@/services/api'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()

const qrImagen = ref('')
const historial = ref([])
const esHincha = computed(() => auth.usuario?.rol === 'hincha')
const puntos = computed(() => (auth.usuario?.puntos ?? 0).toLocaleString('es-CO'))

// RF-04: el QR se genera a partir del qr_token del hincha
watch(
  () => auth.usuario?.qr_token,
  async (token) => {
    if (!token) {
      qrImagen.value = ''
      return
    }
    qrImagen.value = await QRCode.toDataURL(token, {
      width: 480,
      margin: 1,
      color: { dark: '#1d2b24', light: '#ffffff' },
    })
  },
  { immediate: true }
)

onMounted(async () => {
  // Refresca los puntos por si el funcionario acaba de registrar un reciclaje
  await auth.cargarUsuario()
  if (!esHincha.value) return
  try {
    historial.value = (await api.get('/verificaciones/mias')).data
  } catch {
    historial.value = []
  }
})

function salir() {
  auth.logout()
  router.push('/')
}
</script>

<template>
  <section v-if="auth.usuario" class="perfil">
    <h1>Hola, {{ auth.usuario.nombre }}</h1>

    <div v-if="esHincha" class="tarjeta qr">
      <h2>Mi código QR</h2>
      <img v-if="qrImagen" :src="qrImagen" alt="Código QR personal del hincha" />
      <p>Muéstralo al funcionario en el punto de recolección</p>
    </div>

    <div v-if="esHincha" class="tarjeta resumen">
      <div>
        <span class="etiqueta">Mi equipo</span>
        <span class="valor">{{ auth.usuario.equipo }}</span>
        <span v-if="auth.usuario.puntos > 0" class="etiqueta">
          Puesto {{ auth.usuario.posicion_en_equipo }} en tu equipo ·
          {{ auth.usuario.posicion_general }} en general
        </span>
      </div>
      <div>
        <span class="etiqueta">Mis puntos</span>
        <span class="puntos">{{ puntos }}</span>
      </div>
    </div>

    <div v-if="esHincha" class="tarjeta">
      <h2 style="margin: 0 0 0.75rem; font-size: 1.1rem">Mis últimos reciclajes</h2>
      <p v-if="!historial.length" class="apagado" style="margin: 0">
        Aún no tienes reciclajes. Lleva tu material al punto de recolección del estadio.
      </p>
      <div v-else class="tabla-caja">
        <table>
          <thead>
            <tr><th>Fecha</th><th>Partido</th><th>Residuo</th><th class="num">Pts.</th></tr>
          </thead>
          <tbody>
            <tr v-for="h in historial" :key="h.id">
              <td>{{ new Date(h.fecha_hora).toLocaleDateString('es-CO') }}</td>
              <td>{{ h.partido }}</td>
              <td>{{ h.cantidad }} × {{ h.residuo }}</td>
              <td class="num">+{{ h.puntos }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="tarjeta">
      <dl>
        <dt>Nombre</dt>
        <dd>{{ auth.usuario.nombre }}</dd>
        <dt>Correo</dt>
        <dd>{{ auth.usuario.email }}</dd>
        <dt>Rol</dt>
        <dd>{{ auth.usuario.rol }}</dd>
      </dl>
      <div class="fila-botones">
        <RouterLink class="boton" to="/ranking">Ver ranking</RouterLink>
        <button class="boton secundario" @click="salir">Cerrar sesión</button>
      </div>
    </div>
  </section>
  <p v-else>Cargando...</p>
</template>
