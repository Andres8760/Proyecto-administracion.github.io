<script setup>
// Tabla genérica para crear, editar y eliminar datos maestros (RF-10, RF-11).
// Cada sección del panel le pasa su ruta de la API, sus campos y sus columnas.
import { ref, onMounted } from 'vue'
import api from '@/services/api'

const props = defineProps({
  titulo: { type: String, required: true },
  ruta: { type: String, required: true }, // ej. 'equipos' → /api/admin/equipos
  campos: { type: Array, required: true }, // { clave, etiqueta, tipo, opciones?, opcional? }
  columnas: { type: Array, required: true }, // { clave, etiqueta, formato?, num? }
})
const emit = defineEmits(['cambio'])

const filas = ref([])
const editandoId = ref(null) // null = cerrado, 'nuevo' = creando, número = editando
const formulario = ref({})
const error = ref('')
const aviso = ref('')
const guardando = ref(false)

function aLocal(iso) {
  // ISO → valor de <input type="datetime-local"> en hora local
  if (!iso) return ''
  const d = new Date(iso)
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

async function cargar() {
  try {
    filas.value = (await api.get(`/admin/${props.ruta}`)).data
  } catch (e) {
    error.value = e.response?.data?.error || 'No se pudo cargar la información'
  }
}

function abrir(fila) {
  error.value = ''
  aviso.value = ''
  editandoId.value = fila ? fila.id : 'nuevo'
  formulario.value = Object.fromEntries(
    props.campos.map((c) => {
      const valor = fila?.[c.clave] ?? ''
      return [c.clave, c.tipo === 'datetime-local' ? aLocal(valor) : valor]
    })
  )
}

function cerrar() {
  editandoId.value = null
  error.value = ''
}

async function guardar() {
  error.value = ''
  guardando.value = true
  const datos = { ...formulario.value }
  for (const c of props.campos) {
    if (c.tipo === 'datetime-local' && datos[c.clave]) {
      datos[c.clave] = new Date(datos[c.clave]).toISOString()
    }
  }
  try {
    if (editandoId.value === 'nuevo') await api.post(`/admin/${props.ruta}`, datos)
    else await api.put(`/admin/${props.ruta}/${editandoId.value}`, datos)
    aviso.value = editandoId.value === 'nuevo' ? 'Registro creado' : 'Cambios guardados'
    editandoId.value = null
    await cargar()
    emit('cambio')
  } catch (e) {
    error.value = e.response?.data?.error || 'No se pudo guardar'
  } finally {
    guardando.value = false
  }
}

async function eliminar(fila) {
  if (!window.confirm('¿Seguro que quieres eliminar este registro?')) return
  error.value = ''
  aviso.value = ''
  try {
    await api.delete(`/admin/${props.ruta}/${fila.id}`)
    aviso.value = 'Registro eliminado'
    await cargar()
    emit('cambio')
  } catch (e) {
    error.value = e.response?.data?.error || 'No se pudo eliminar'
  }
}

function mostrar(fila, col) {
  const valor = fila[col.clave]
  return col.formato ? col.formato(valor, fila) : (valor ?? '—')
}

onMounted(cargar)
defineExpose({ cargar })
</script>

<template>
  <div class="tarjeta" style="display: grid; gap: 1rem">
    <div style="display: flex; justify-content: space-between; align-items: center; gap: 1rem">
      <h2 style="margin: 0">{{ titulo }}</h2>
      <button v-if="editandoId === null" class="boton pequeno" @click="abrir(null)">+ Nuevo</button>
    </div>

    <form v-if="editandoId !== null" class="form-grid" @submit.prevent="guardar">
      <label v-for="c in campos" :key="c.clave">
        {{ c.etiqueta }}
        <select v-if="c.tipo === 'select'" v-model="formulario[c.clave]" :required="!c.opcional">
          <option value="" disabled>Elige…</option>
          <option v-for="o in c.opciones()" :key="o.valor" :value="o.valor">{{ o.texto }}</option>
        </select>
        <input
          v-else
          v-model="formulario[c.clave]"
          :type="c.tipo || 'text'"
          :required="!c.opcional"
          :min="c.tipo === 'number' ? 1 : undefined"
        />
      </label>
      <div class="fila-botones">
        <button class="boton" :disabled="guardando">
          {{ editandoId === 'nuevo' ? 'Crear' : 'Guardar' }}
        </button>
        <button type="button" class="boton secundario" @click="cerrar">Cancelar</button>
      </div>
    </form>

    <p v-if="error" class="error">{{ error }}</p>
    <p v-if="aviso" class="exito">{{ aviso }}</p>

    <div class="tabla-caja">
      <p v-if="!filas.length" class="apagado">No hay registros todavía.</p>
      <table v-else>
        <thead>
          <tr>
            <th v-for="col in columnas" :key="col.clave" :class="{ num: col.num }">
              {{ col.etiqueta }}
            </th>
            <th class="num">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="fila in filas" :key="fila.id">
            <td v-for="col in columnas" :key="col.clave" :class="{ num: col.num }">
              {{ mostrar(fila, col) }}
            </td>
            <td>
              <div class="acciones">
                <button class="boton secundario pequeno" @click="abrir(fila)">Editar</button>
                <button class="boton peligro pequeno" @click="eliminar(fila)">Eliminar</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
