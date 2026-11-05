<script setup>
import { ref, onMounted } from 'vue'
import api from '@/services/api'
import TablaCrud from '@/components/admin/TablaCrud.vue'
import ReportesAdmin from '@/components/admin/ReportesAdmin.vue'
import UsuariosAdmin from '@/components/admin/UsuariosAdmin.vue'

const seccion = ref('reportes')
const secciones = [
  { id: 'reportes', nombre: 'Reportes' },
  { id: 'equipos', nombre: 'Equipos' },
  { id: 'estadios', nombre: 'Estadios' },
  { id: 'partidos', nombre: 'Partidos' },
  { id: 'residuos', nombre: 'Tipos de residuo' },
  { id: 'usuarios', nombre: 'Usuarios' },
]

// Listas para los desplegables del formulario de partidos
const equipos = ref([])
const estadios = ref([])

async function cargarListas() {
  const [e, s] = await Promise.all([api.get('/admin/equipos'), api.get('/admin/estadios')])
  equipos.value = e.data
  estadios.value = s.data
}
onMounted(cargarListas)

const opcionesEquipos = () => equipos.value.map((e) => ({ valor: e.id, texto: e.nombre }))
const opcionesEstadios = () => estadios.value.map((e) => ({ valor: e.id, texto: e.nombre }))
const fechaHora = (f) =>
  new Date(f).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })
</script>

<template>
  <section class="pagina">
    <header>
      <h1>Panel del administrador</h1>
      <p>Gestiona los datos de la liga y consulta los reportes de reciclaje.</p>
    </header>

    <div class="pestanas">
      <button
        v-for="s in secciones"
        :key="s.id"
        :class="{ activa: seccion === s.id }"
        @click="seccion = s.id"
      >
        {{ s.nombre }}
      </button>
    </div>

    <ReportesAdmin v-if="seccion === 'reportes'" />

    <TablaCrud
      v-else-if="seccion === 'equipos'"
      titulo="Equipos"
      ruta="equipos"
      :campos="[
        { clave: 'nombre', etiqueta: 'Nombre' },
        { clave: 'ciudad', etiqueta: 'Ciudad' },
        { clave: 'escudo_url', etiqueta: 'URL del escudo (opcional)', opcional: true },
      ]"
      :columnas="[
        { clave: 'nombre', etiqueta: 'Nombre' },
        { clave: 'ciudad', etiqueta: 'Ciudad' },
      ]"
      @cambio="cargarListas"
    />

    <TablaCrud
      v-else-if="seccion === 'estadios'"
      titulo="Estadios"
      ruta="estadios"
      :campos="[
        { clave: 'nombre', etiqueta: 'Nombre' },
        { clave: 'ciudad', etiqueta: 'Ciudad' },
      ]"
      :columnas="[
        { clave: 'nombre', etiqueta: 'Nombre' },
        { clave: 'ciudad', etiqueta: 'Ciudad' },
      ]"
      @cambio="cargarListas"
    />

    <TablaCrud
      v-else-if="seccion === 'partidos'"
      titulo="Partidos"
      ruta="partidos"
      :campos="[
        { clave: 'equipo_local_id', etiqueta: 'Equipo local', tipo: 'select', opciones: opcionesEquipos },
        { clave: 'equipo_visitante_id', etiqueta: 'Equipo visitante', tipo: 'select', opciones: opcionesEquipos },
        { clave: 'estadio_id', etiqueta: 'Estadio', tipo: 'select', opciones: opcionesEstadios },
        { clave: 'fecha', etiqueta: 'Fecha y hora', tipo: 'datetime-local' },
      ]"
      :columnas="[
        { clave: 'equipo_local', etiqueta: 'Local' },
        { clave: 'equipo_visitante', etiqueta: 'Visitante' },
        { clave: 'estadio', etiqueta: 'Estadio' },
        { clave: 'fecha', etiqueta: 'Fecha', formato: fechaHora },
      ]"
    />

    <TablaCrud
      v-else-if="seccion === 'residuos'"
      titulo="Tipos de residuo"
      ruta="tipos-residuo"
      :campos="[
        { clave: 'nombre', etiqueta: 'Nombre' },
        { clave: 'puntos_por_unidad', etiqueta: 'Puntos por unidad', tipo: 'number' },
      ]"
      :columnas="[
        { clave: 'nombre', etiqueta: 'Nombre' },
        { clave: 'puntos_por_unidad', etiqueta: 'Puntos por unidad', num: true },
      ]"
    />

    <UsuariosAdmin v-else-if="seccion === 'usuarios'" />

    <p v-if="seccion === 'residuos'" class="apagado">
      Cambiar los puntos de un residuo solo afecta los reciclajes nuevos: los anteriores conservan
      sus puntos (CA-09).
    </p>
  </section>
</template>
