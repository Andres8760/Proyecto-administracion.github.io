<script setup>
import { ref, onMounted } from 'vue'
import api from '@/services/api'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const top = ref([])

onMounted(async () => {
  try {
    top.value = (await api.get('/ranking/equipos')).data.slice(0, 3)
  } catch {
    top.value = []
  }
})
</script>

<template>
  <section class="perfil">
    <div class="tarjeta" style="display: grid; gap: 0.75rem">
      <h1 style="margin: 0">Recicla por tu equipo</h1>
      <p style="margin: 0">
        Deposita tus residuos en las entradas del estadio, muestra tu QR y suma puntos para el equipo
        de tus amores.
      </p>
      <RouterLink v-if="!auth.estaLogueado" class="boton" to="/registro">Empezar</RouterLink>
      <RouterLink v-else class="boton" :to="auth.rutaInicio">Ir a mi espacio</RouterLink>
    </div>

    <div class="tarjeta">
      <h2 style="margin: 0 0 0.75rem; font-size: 1.1rem">¿Cómo funciona?</h2>
      <div class="pasos">
        <div class="paso"><b>1</b>Regístrate y elige tu equipo</div>
        <div class="paso"><b>2</b>Lleva tu material reciclable al estadio</div>
        <div class="paso"><b>3</b>El funcionario escanea tu QR</div>
        <div class="paso"><b>4</b>Suman puntos tú y tu equipo</div>
      </div>
    </div>

    <div v-if="top.length" class="tarjeta">
      <h2 style="margin: 0 0 0.75rem; font-size: 1.1rem">Los equipos que más reciclan</h2>
      <table>
        <tbody>
          <tr v-for="e in top" :key="e.id">
            <td>{{ e.posicion }}.º</td>
            <td>{{ e.nombre }}</td>
            <td class="num">{{ e.puntos.toLocaleString('es-CO') }} pts</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
