<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import api from '@/services/api'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const vista = ref('equipos')
const equipos = ref([])
const hinchas = ref([])
const filtroEquipo = ref('')
const error = ref('')

const podio = computed(() => equipos.value.slice(0, 3))
const fmt = (n) => Number(n).toLocaleString('es-CO')

async function cargarEquipos() {
  try {
    equipos.value = (await api.get('/ranking/equipos')).data
  } catch {
    error.value = 'No se pudo cargar el ranking'
  }
}

async function cargarHinchas() {
  try {
    const params = filtroEquipo.value ? { equipo_id: filtroEquipo.value } : {}
    hinchas.value = (await api.get('/ranking/hinchas', { params })).data
  } catch {
    error.value = 'No se pudo cargar el ranking de hinchas'
  }
}

onMounted(() => {
  cargarEquipos()
  cargarHinchas()
})
watch(filtroEquipo, cargarHinchas)
</script>

<template>
  <section class="pagina">
    <header>
      <h1>Ranking</h1>
      <p>Clasificación por puntos de reciclaje.</p>
    </header>

    <div class="pestanas">
      <button :class="{ activa: vista === 'equipos' }" @click="vista = 'equipos'">Equipos</button>
      <button :class="{ activa: vista === 'hinchas' }" @click="vista = 'hinchas'">Hinchas</button>
    </div>

    <p v-if="error" class="error">{{ error }}</p>

    <template v-if="vista === 'equipos'">
      <div class="podio">
        <div v-for="(e, i) in podio" :key="e.id" class="tarjeta" :class="{ primero: i === 0 }">
          <span class="lugar">{{ e.posicion }}.º puesto</span>
          <strong>{{ e.nombre }}</strong>
          <span class="pts">{{ fmt(e.puntos) }} pts</span>
        </div>
      </div>

      <div class="tarjeta tabla-caja">
        <table>
          <thead>
            <tr>
              <th>Pos.</th>
              <th>Equipo</th>
              <th class="num">Hinchas</th>
              <th class="num">Puntos</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="e in equipos"
              :key="e.id"
              :class="{ resaltada: e.id === auth.usuario?.equipo_id }"
            >
              <td>{{ e.posicion }}</td>
              <td>
                {{ e.nombre }}
                <span v-if="e.id === auth.usuario?.equipo_id" class="apagado">(tu equipo)</span>
              </td>
              <td class="num">{{ fmt(e.hinchas) }}</td>
              <td class="num">{{ fmt(e.puntos) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>

    <template v-else>
      <label style="max-width: 320px">
        Filtrar por equipo
        <select v-model="filtroEquipo">
          <option value="">Todos los equipos</option>
          <option v-for="e in equipos" :key="e.id" :value="e.id">{{ e.nombre }}</option>
        </select>
      </label>

      <div class="tarjeta tabla-caja">
        <p v-if="!hinchas.length" class="apagado">Todavía no hay hinchas en este ranking.</p>
        <table v-else>
          <thead>
            <tr>
              <th>Pos.</th>
              <th>Hincha</th>
              <th>Equipo</th>
              <th class="num">Puntos</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="h in hinchas" :key="h.id" :class="{ resaltada: h.id === auth.usuario?.id }">
              <td>{{ filtroEquipo ? h.posicion_en_equipo : h.posicion_general }}</td>
              <td>
                {{ h.nombre }}
                <span v-if="h.id === auth.usuario?.id" class="apagado">(tú)</span>
              </td>
              <td>{{ h.equipo }}</td>
              <td class="num">{{ fmt(h.puntos) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </section>
</template>
