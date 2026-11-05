<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { Html5Qrcode } from 'html5-qrcode'
import api from '@/services/api'

// Pasos: 'escanear' → 'confirmar' → 'listo'
const paso = ref('escanear')
const error = ref('')
const cargando = ref(false)

const partidos = ref([])
const tipos = ref([])
const recientes = ref([])

const camaraActiva = ref(false)
const codigoManual = ref('')
let lector = null

const hincha = ref(null)
const qrToken = ref('')
const codigoEscaneo = ref('')
const partidoId = ref('')
const tipoId = ref(null)
const cantidad = ref(1)
const resultado = ref(null)

const tipoElegido = computed(() => tipos.value.find((t) => t.id === tipoId.value))
const puntosEstimados = computed(() =>
  tipoElegido.value && cantidad.value > 0 ? cantidad.value * tipoElegido.value.puntos_por_unidad : 0
)
const iniciales = computed(() =>
  (hincha.value?.nombre ?? '')
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('')
)

function textoPartido(p) {
  const fecha = new Date(p.fecha).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })
  return `${p.equipo_local} vs. ${p.equipo_visitante} · ${fecha}`
}

function formatoFecha(f) {
  return new Date(f).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })
}

// Un código distinto por cada escaneo. Si el mismo se envía dos veces
// (doble clic, se cayó el internet), el backend guarda una sola verificación (CA-10).
function nuevoCodigo() {
  if (crypto.randomUUID) return crypto.randomUUID()
  return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, (c) =>
    (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16)
  )
}

async function cargarRecientes() {
  try {
    recientes.value = (await api.get('/verificaciones/recientes')).data
  } catch {
    recientes.value = []
  }
}

onMounted(async () => {
  try {
    const [p, t] = await Promise.all([api.get('/partidos'), api.get('/tipos-residuo')])
    partidos.value = p.data
    tipos.value = t.data
    // Por defecto, el partido con la fecha más cercana a hoy
    const ahora = Date.now()
    const cercano = [...p.data].sort(
      (a, b) => Math.abs(new Date(a.fecha) - ahora) - Math.abs(new Date(b.fecha) - ahora)
    )[0]
    partidoId.value = cercano?.id ?? ''
    tipoId.value = t.data[0]?.id ?? null
  } catch {
    error.value = 'No se pudieron cargar los partidos y los tipos de residuo'
  }
  cargarRecientes()
})

async function encenderCamara() {
  error.value = ''
  try {
    lector = new Html5Qrcode('lector')
    await lector.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: 230 },
      (texto) => {
        apagarCamara()
        buscarHincha(texto)
      },
      () => {}
    )
    camaraActiva.value = true
  } catch {
    error.value =
      'No se pudo abrir la cámara. Revisa el permiso del navegador o sube una foto del QR.'
    lector = null
  }
}

async function apagarCamara() {
  if (lector && camaraActiva.value) {
    try {
      await lector.stop()
      lector.clear()
    } catch {
      /* ya estaba detenida */
    }
  }
  camaraActiva.value = false
  lector = null
}

async function leerFoto(evento) {
  const archivo = evento.target.files?.[0]
  evento.target.value = ''
  if (!archivo) return
  error.value = ''
  await apagarCamara()
  try {
    const lectorArchivo = new Html5Qrcode('lector-archivo')
    const texto = await lectorArchivo.scanFile(archivo, false)
    lectorArchivo.clear()
    buscarHincha(texto)
  } catch {
    error.value = 'No se encontró un código QR en esa imagen'
  }
}

async function buscarHincha(texto) {
  const token = texto.trim()
  error.value = ''
  cargando.value = true
  try {
    const { data } = await api.get(`/verificaciones/hincha/${encodeURIComponent(token)}`)
    hincha.value = data
    qrToken.value = token
    codigoEscaneo.value = nuevoCodigo()
    cantidad.value = 1
    paso.value = 'confirmar'
  } catch (e) {
    // CA-06: QR que no corresponde a ningún hincha
    error.value = e.response?.data?.error || 'No se pudo verificar el QR'
  } finally {
    cargando.value = false
  }
}

async function confirmar() {
  error.value = ''
  if (!partidoId.value || !tipoId.value) {
    error.value = 'Elige el partido y el tipo de residuo'
    return
  }
  if (!Number.isInteger(Number(cantidad.value)) || Number(cantidad.value) < 1) {
    error.value = 'La cantidad debe ser un número entero mayor a cero'
    return
  }
  cargando.value = true
  try {
    const { data } = await api.post('/verificaciones', {
      qr_token: qrToken.value,
      codigo_escaneo: codigoEscaneo.value,
      partido_id: partidoId.value,
      tipo_residuo_id: tipoId.value,
      cantidad: Number(cantidad.value),
    })
    resultado.value = data
    paso.value = 'listo'
    cargarRecientes()
  } catch (e) {
    error.value = e.response?.data?.error || 'No se pudo registrar el reciclaje'
  } finally {
    cargando.value = false
  }
}

function otroEscaneo() {
  hincha.value = null
  qrToken.value = ''
  codigoManual.value = ''
  resultado.value = null
  error.value = ''
  paso.value = 'escanear'
}

onBeforeUnmount(apagarCamara)
</script>

<template>
  <section class="pagina">
    <header>
      <h1>Registrar reciclaje</h1>
      <p>Escanea el QR del hincha, revisa lo que entrega y confirma.</p>
    </header>

    <div class="columnas">
      <!-- Paso 1: escanear -->
      <div class="tarjeta" style="display: grid; gap: 1rem">
        <h2>1. Escanear QR</h2>
        <div v-show="camaraActiva" id="lector"></div>
        <div v-if="!camaraActiva" class="camara-vacia">
          <p v-if="paso === 'escanear'">Enciende la cámara y apunta al QR del hincha</p>
          <p v-else>QR leído ✔</p>
        </div>
        <div id="lector-archivo" hidden></div>

        <div v-if="paso === 'escanear'" class="fila-botones">
          <button v-if="!camaraActiva" class="boton" @click="encenderCamara">Encender cámara</button>
          <button v-else class="boton secundario" @click="apagarCamara">Apagar cámara</button>
          <label class="boton secundario">
            Subir foto del QR
            <input type="file" accept="image/*" hidden @change="leerFoto" />
          </label>
        </div>

        <form v-if="paso === 'escanear'" @submit.prevent="buscarHincha(codigoManual)">
          <label>
            O escribe el código del QR
            <input v-model="codigoManual" placeholder="ej. 7c9e6679-7425-40de-944b-e07fc1f90ae7" />
          </label>
          <button class="boton secundario" :disabled="!codigoManual || cargando">Buscar hincha</button>
        </form>

        <p v-if="error && paso === 'escanear'" class="error">{{ error }}</p>
      </div>

      <!-- Paso 2: confirmar -->
      <div class="tarjeta" style="display: grid; gap: 1rem">
        <h2>2. Confirmar entrega</h2>

        <p v-if="paso === 'escanear'" class="apagado">
          Cuando escanees un QR válido, aquí aparecen los datos del hincha.
        </p>

        <template v-if="paso === 'confirmar'">
          <div class="hincha-encontrado">
            <div class="avatar">{{ iniciales }}</div>
            <div>
              <strong>{{ hincha.nombre }}</strong>
              <div class="apagado">Hincha de {{ hincha.equipo }} · QR válido</div>
            </div>
          </div>

          <label>
            Partido
            <select v-model="partidoId">
              <option v-for="p in partidos" :key="p.id" :value="p.id">{{ textoPartido(p) }}</option>
            </select>
          </label>

          <div style="display: grid; gap: 0.4rem">
            <span style="font-size: 0.9rem; font-weight: 600">Tipo de residuo</span>
            <div class="opciones">
              <button
                v-for="t in tipos"
                :key="t.id"
                type="button"
                :class="{ activa: t.id === tipoId }"
                @click="tipoId = t.id"
              >
                {{ t.nombre }} · {{ t.puntos_por_unidad }} pts
              </button>
            </div>
          </div>

          <div class="form-grid">
            <label>
              Cantidad (unidades)
              <input v-model.number="cantidad" type="number" min="1" step="1" />
            </label>
            <div class="puntos-a-sumar">
              <span class="apagado">Puntos a sumar</span>
              <strong>+{{ puntosEstimados }}</strong>
            </div>
          </div>

          <p v-if="error" class="error">{{ error }}</p>
          <div class="fila-botones">
            <button class="boton" :disabled="cargando" @click="confirmar">
              {{ cargando ? 'Guardando...' : 'Confirmar reciclaje' }}
            </button>
            <button class="boton secundario" :disabled="cargando" @click="otroEscaneo">Cancelar</button>
          </div>
        </template>

        <template v-if="paso === 'listo'">
          <p class="exito">
            <template v-if="resultado.duplicada">
              Este escaneo ya estaba registrado; no se sumó dos veces.
            </template>
            <template v-else>
              ✔ Se sumaron <b>{{ resultado.verificacion.puntos }} puntos</b> a
              {{ resultado.hincha.nombre }} y a {{ resultado.hincha.equipo }}
              ({{ resultado.cantidad }} × {{ resultado.residuo }}).
            </template>
          </p>
          <button class="boton" @click="otroEscaneo">Escanear otro QR</button>
        </template>
      </div>
    </div>

    <div class="tarjeta">
      <h2>Mis últimos registros</h2>
      <p v-if="!recientes.length" class="apagado">Todavía no has registrado reciclajes.</p>
      <div v-else class="tabla-caja">
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Hincha</th>
              <th>Equipo</th>
              <th>Residuo</th>
              <th class="num">Cantidad</th>
              <th class="num">Puntos</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in recientes" :key="r.id">
              <td>{{ formatoFecha(r.fecha_hora) }}</td>
              <td>{{ r.hincha }}</td>
              <td>{{ r.equipo }}</td>
              <td>{{ r.residuo }}</td>
              <td class="num">{{ r.cantidad }}</td>
              <td class="num">+{{ r.puntos }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>
</template>
