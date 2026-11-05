<script setup>
// RF-12: reportes de reciclaje por equipo, partido y residuo en un periodo
import { ref, computed, onMounted } from 'vue'
import api from '@/services/api'

const desde = ref('')
const hasta = ref('')
const datos = ref(null)
const error = ref('')

const fmt = (n) => Number(n ?? 0).toLocaleString('es-CO')
const maxEquipo = computed(() => Math.max(1, ...(datos.value?.porEquipo ?? []).map((e) => e.puntos)))

async function cargar() {
  error.value = ''
  try {
    const params = {}
    if (desde.value) params.desde = desde.value
    if (hasta.value) params.hasta = hasta.value
    datos.value = (await api.get('/admin/reportes', { params })).data
  } catch (e) {
    error.value = e.response?.data?.error || 'No se pudo cargar el reporte'
  }
}

function limpiar() {
  desde.value = ''
  hasta.value = ''
  cargar()
}

onMounted(cargar)
</script>

<template>
  <div style="display: grid; gap: 1.25rem">
    <form class="tarjeta form-grid" @submit.prevent="cargar">
      <label>Desde <input v-model="desde" type="date" /></label>
      <label>Hasta <input v-model="hasta" type="date" /></label>
      <div class="fila-botones">
        <button class="boton">Filtrar</button>
        <button type="button" class="boton secundario" @click="limpiar">Todo el periodo</button>
      </div>
    </form>

    <p v-if="error" class="error">{{ error }}</p>

    <template v-if="datos">
      <div class="cifras">
        <div class="tarjeta cifra">
          <span>Verificaciones</span><strong>{{ fmt(datos.resumen.verificaciones) }}</strong>
        </div>
        <div class="tarjeta cifra">
          <span>Unidades recicladas</span><strong>{{ fmt(datos.resumen.unidades) }}</strong>
        </div>
        <div class="tarjeta cifra">
          <span>Puntos entregados</span><strong>{{ fmt(datos.resumen.puntos) }}</strong>
        </div>
        <div class="tarjeta cifra">
          <span>Hinchas que reciclaron</span><strong>{{ fmt(datos.resumen.hinchas) }}</strong>
        </div>
      </div>

      <div class="columnas">
        <div class="tarjeta tabla-caja">
          <h2>Por equipo</h2>
          <p v-if="!datos.porEquipo.length" class="apagado">Sin datos en este periodo.</p>
          <table v-else>
            <thead>
              <tr><th>Equipo</th><th></th><th class="num">Unidades</th><th class="num">Puntos</th></tr>
            </thead>
            <tbody>
              <tr v-for="e in datos.porEquipo" :key="e.nombre">
                <td>{{ e.nombre }}</td>
                <td>
                  <div class="barra-dato"><span :style="{ width: (e.puntos / maxEquipo) * 100 + '%' }"></span></div>
                </td>
                <td class="num">{{ fmt(e.unidades) }}</td>
                <td class="num">{{ fmt(e.puntos) }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="tarjeta tabla-caja">
          <h2>Por tipo de residuo</h2>
          <p v-if="!datos.porResiduo.length" class="apagado">Sin datos en este periodo.</p>
          <table v-else>
            <thead>
              <tr><th>Residuo</th><th class="num">Verificaciones</th><th class="num">Unidades</th></tr>
            </thead>
            <tbody>
              <tr v-for="r in datos.porResiduo" :key="r.nombre">
                <td>{{ r.nombre }}</td>
                <td class="num">{{ fmt(r.verificaciones) }}</td>
                <td class="num">{{ fmt(r.unidades) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="tarjeta tabla-caja">
        <h2>Por partido</h2>
        <p v-if="!datos.porPartido.length" class="apagado">Sin datos en este periodo.</p>
        <table v-else>
          <thead>
            <tr>
              <th>Partido</th><th>Estadio</th><th>Fecha</th>
              <th class="num">Verificaciones</th><th class="num">Unidades</th><th class="num">Puntos</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in datos.porPartido" :key="p.nombre + p.fecha">
              <td>{{ p.nombre }}</td>
              <td>{{ p.estadio }}</td>
              <td>{{ new Date(p.fecha).toLocaleDateString('es-CO') }}</td>
              <td class="num">{{ fmt(p.verificaciones) }}</td>
              <td class="num">{{ fmt(p.unidades) }}</td>
              <td class="num">{{ fmt(p.puntos) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </div>
</template>
