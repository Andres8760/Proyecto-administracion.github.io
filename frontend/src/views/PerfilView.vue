<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import QRCode from 'qrcode'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()

const qrImagen = ref('')
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
      </div>
      <div>
        <span class="etiqueta">Mis puntos</span>
        <span class="puntos">{{ puntos }}</span>
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
      <button class="boton secundario" @click="salir">Cerrar sesión</button>
    </div>
  </section>
  <p v-else>Cargando...</p>
</template>
