<script setup>
import { useAuthStore } from '@/stores/auth'
const auth = useAuthStore()
</script>

<template>
  <section class="tarjeta">
    <h1>Recicla por tu equipo</h1>
    <p>
      Deposita tus residuos en las entradas del estadio, escanea el QR y suma puntos para el
      equipo de tus amores.
    </p>
    <RouterLink v-if="!auth.estaLogueado" class="boton" to="/registro">Empezar</RouterLink>
    <RouterLink v-else class="boton" to="/perfil">Ir a mi perfil</RouterLink>
  </section>
</template>