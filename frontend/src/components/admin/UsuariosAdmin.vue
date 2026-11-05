<script setup>
// El administrador asigna roles: así se crean los funcionarios (RN-07)
import { ref, onMounted } from 'vue'
import api from '@/services/api'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const usuarios = ref([])
const error = ref('')
const aviso = ref('')

async function cargar() {
  try {
    usuarios.value = (await api.get('/admin/usuarios')).data
  } catch (e) {
    error.value = e.response?.data?.error || 'No se pudieron cargar los usuarios'
  }
}

async function cambiarRol(u, rol) {
  error.value = ''
  aviso.value = ''
  try {
    await api.put(`/admin/usuarios/${u.id}/rol`, { rol })
    aviso.value = `${u.nombre} ahora es ${rol}`
  } catch (e) {
    error.value = e.response?.data?.error || 'No se pudo cambiar el rol'
  }
  await cargar()
}

onMounted(cargar)
</script>

<template>
  <div class="tarjeta" style="display: grid; gap: 1rem">
    <h2 style="margin: 0">Usuarios y roles</h2>
    <p class="apagado" style="margin: 0">
      Todo usuario nuevo se registra como hincha. Desde aquí puedes volverlo funcionario o
      administrador. Un funcionario solo puede volver a ser hincha si tiene equipo favorito.
    </p>
    <p v-if="error" class="error">{{ error }}</p>
    <p v-if="aviso" class="exito">{{ aviso }}</p>

    <div class="tabla-caja">
      <table>
        <thead>
          <tr><th>Nombre</th><th>Correo</th><th>Equipo</th><th>Rol</th></tr>
        </thead>
        <tbody>
          <tr v-for="u in usuarios" :key="u.id">
            <td>{{ u.nombre }}</td>
            <td>{{ u.email }}</td>
            <td>{{ u.equipo ?? '—' }}</td>
            <td>
              <span v-if="u.id === auth.usuario?.id" class="apagado">{{ u.rol }} (tú)</span>
              <select v-else :value="u.rol" @change="cambiarRol(u, $event.target.value)">
                <option value="hincha">hincha</option>
                <option value="funcionario">funcionario</option>
                <option value="administrador">administrador</option>
              </select>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
