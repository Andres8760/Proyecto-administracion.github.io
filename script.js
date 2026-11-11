/* FutCiclar · versión demo para GitHub Pages
   Replica las pantallas de la app Vue con datos simulados guardados en el navegador (localStorage). */
const $ = (s) => document.querySelector(s)
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
const fmt = (n) => Number(n ?? 0).toLocaleString('es-CO')
const fecha = (f, o = { dateStyle: 'short', timeStyle: 'short' }) => new Date(f).toLocaleString('es-CO', o)
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => ((Math.random() * 16) | 0).toString(16)))
const KEY = 'futciclar-demo-v1'
const DIA = 86400000

/* ---------- Datos de ejemplo ---------- */
function semilla() {
  const equipos = ['America de Cali|Cali', 'Atletico Nacional|Medellin', 'Deportivo Cali|Cali', 'Independiente Santa Fe|Bogota', 'Junior|Barranquilla', 'Millonarios|Bogota'].map((t, i) => ({ id: i + 1, nombre: t.split('|')[0], ciudad: t.split('|')[1] }))
  const estadios = ['Estadio Pascual Guerrero|Cali', 'Estadio Atanasio Girardot|Medellin', 'Estadio El Campin|Bogota', 'Estadio Metropolitano|Barranquilla'].map((t, i) => ({ id: i + 1, nombre: t.split('|')[0], ciudad: t.split('|')[1] }))
  const now = Date.now()
  const partidos = [[1, 3, 2, -7], [1, 1, 6, 0], [3, 4, 5, 3], [2, 2, 1, 7]].map((p, i) => ({ id: i + 1, estadio_id: p[0], local: p[1], visitante: p[2], fecha: now + p[3] * DIA }))
  const residuos = [{ id: 1, nombre: 'Plastico', puntos_por_unidad: 10 }, { id: 2, nombre: 'Vidrio', puntos_por_unidad: 15 }, { id: 3, nombre: 'Papel', puntos_por_unidad: 5 }]
  const usuarios = [
    { id: 1, nombre: 'Administrador de prueba', email: 'admin@futciclar.test', password: 'Admin12345', rol: 'administrador' },
    { id: 2, nombre: 'Funcionario de prueba', email: 'funcionario@futciclar.test', password: 'Funcionario123', rol: 'funcionario' },
  ]
  const hinchas = [['Camila Ortiz', 1, [[1, 12], [2, 4]]], ['Juan Pérez', 3, [[1, 20], [3, 10]]], ['Laura Gómez', 2, [[2, 9]]], ['Santiago Ruiz', 6, [[1, 8], [2, 2]]], ['Valentina Mora', 3, [[3, 25]]], ['Daniel Rojas', 5, [[1, 15]]], ['Sofía Castro', 4, [[2, 5], [1, 5]]], ['Andrés Díaz', 1, [[1, 6]]]]
  const verifs = []
  hinchas.forEach((h, i) => {
    const id = 10 + i
    usuarios.push({ id, nombre: h[0], email: `hincha${i + 1}@futciclar.test`, password: 'Hincha12345', rol: 'hincha', equipo_id: h[1], qr_token: uid() })
    h[2].forEach(([r, c], k) => verifs.push({ id: uid(), hincha_id: id, partido_id: 1 + (k % 2), residuo_id: r, cantidad: c, puntos: c * residuos[r - 1].puntos_por_unidad, fecha: now - (i + k + 1) * 3600000 * 5 }))
  })
  return { equipos, estadios, partidos, residuos, usuarios, verifs, sesion: null }
}
let db
try { db = JSON.parse(localStorage.getItem(KEY)) } catch { db = null }
if (!db) db = semilla()
const guardar = () => { try { localStorage.setItem(KEY, JSON.stringify(db)) } catch { /* sin almacenamiento */ } }

/* ---------- Consultas ---------- */
const usuario = () => db.usuarios.find((u) => u.id === db.sesion) || null
const nomEq = (id) => db.equipos.find((e) => e.id === id)?.nombre ?? '—'
const puntosDe = (id) => db.verifs.filter((v) => v.hincha_id === id).reduce((a, v) => a + v.puntos, 0)
const inicio = (u) => (u?.rol === 'funcionario' ? '/escaner' : u?.rol === 'administrador' ? '/admin' : '/perfil')
function rankHinchas() {
  const l = db.usuarios.filter((u) => u.rol === 'hincha').map((u) => ({ ...u, puntos: puntosDe(u.id), equipo: nomEq(u.equipo_id) })).sort((a, b) => b.puntos - a.puntos)
  const c = {}
  l.forEach((h, i) => { h.pos_gen = i + 1; c[h.equipo_id] = (c[h.equipo_id] || 0) + 1; h.pos_eq = c[h.equipo_id] })
  return l
}
function rankEquipos() {
  const h = rankHinchas()
  const l = db.equipos.map((e) => { const m = h.filter((x) => x.equipo_id === e.id); return { ...e, hinchas: m.length, puntos: m.reduce((a, x) => a + x.puntos, 0) } }).sort((a, b) => b.puntos - a.puntos)
  l.forEach((e, i) => (e.pos = i + 1))
  return l
}
const textoPartido = (p) => `${nomEq(p.local)} vs. ${nomEq(p.visitante)} · ${fecha(p.fecha, { day: '2-digit', month: 'short' })}`

/* ---------- Estado de pantallas ---------- */
const rk = { vista: 'equipos', eq: '' }
let ad = 'reportes'
const es = { paso: 'escanear', hincha: null, partido: '', tipo: null, cant: 1, res: null, err: '' }
const AVISO = '<p class="aviso">Versión demostración: no hay servidor ni base de datos. Los datos son simulados y se guardan solo en tu navegador.</p>'

/* ---------- Vistas ---------- */
const barra = () => {
  const u = usuario()
  const nav = u
    ? `${u.rol === 'hincha' ? '<a href="#/perfil">Mi perfil</a>' : ''}${u.rol === 'funcionario' ? '<a href="#/escaner">Escanear</a>' : ''}${u.rol === 'administrador' ? '<a href="#/admin">Panel</a>' : ''}<a href="#/ranking">Ranking</a>${u.rol !== 'hincha' ? `<span class="insignia">${u.rol}</span>` : ''}<button class="enlace" data-a="salir">Salir</button>`
    : '<a href="#/login">Entrar</a><a href="#/registro">Registrarme</a>'
  return `<a href="#/" class="marca">♻️ FutCiclar</a><nav>${nav}</nav>`
}

const vHome = () => {
  const u = usuario()
  const top = rankEquipos().slice(0, 3)
  return `<section class="perfil">
    <div class="tarjeta" style="display:grid;gap:.75rem">
      <h1 style="margin:0">Recicla por tu equipo</h1>
      <p style="margin:0">Deposita tus residuos en las entradas del estadio, muestra tu QR y suma puntos para el equipo de tus amores.</p>
      ${u ? `<a class="boton" href="#${inicio(u)}">Ir a mi espacio</a>` : '<a class="boton" href="#/registro">Empezar</a>'}
    </div>
    <div class="tarjeta"><h2>¿Cómo funciona?</h2><div class="pasos">
      <div class="paso"><b>1</b>Regístrate y elige tu equipo</div><div class="paso"><b>2</b>Lleva tu material reciclable al estadio</div>
      <div class="paso"><b>3</b>El funcionario escanea tu QR</div><div class="paso"><b>4</b>Suman puntos tú y tu equipo</div></div></div>
    <div class="tarjeta"><h2>Los equipos que más reciclan</h2><table><tbody>
      ${top.map((e) => `<tr><td>${e.pos}.º</td><td>${esc(e.nombre)}</td><td class="num">${fmt(e.puntos)} pts</td></tr>`).join('')}</tbody></table></div>
    ${AVISO}</section>`
}

const vLogin = () => `<section class="tarjeta"><h1>Iniciar sesión</h1>
  <form data-f="login">
    <label>Correo<input name="email" type="email" autocomplete="email" required /></label>
    <label>Contraseña<input name="password" type="password" autocomplete="current-password" required /></label>
    <p class="error" id="err"></p><button class="boton">Entrar</button>
  </form>
  <p class="pie">¿No tienes cuenta? <a href="#/registro">Regístrate</a></p>
  <ul class="demo-cuentas"><li>Administrador: admin@futciclar.test / Admin12345</li><li>Funcionario: funcionario@futciclar.test / Funcionario123</li><li>Hincha: hincha1@futciclar.test / Hincha12345</li></ul>${AVISO}</section>`

const vRegistro = () => `<section class="tarjeta"><h1>Crear cuenta</h1>
  <form data-f="registro">
    <label>Nombre<input name="nombre" autocomplete="name" required /></label>
    <label>Correo<input name="email" type="email" autocomplete="email" required /></label>
    <label>Tu equipo<select name="equipo" required><option value="" disabled selected>Elige tu equipo</option>${db.equipos.map((e) => `<option value="${e.id}">${esc(e.nombre)}</option>`).join('')}</select></label>
    <label>Contraseña (mínimo 8 caracteres)<input name="password" type="password" autocomplete="new-password" required /></label>
    <label>Confirmar contraseña<input name="confirmar" type="password" autocomplete="new-password" required /></label>
    <p class="error" id="err"></p><button class="boton">Registrarme</button>
  </form>
  <p class="pie">¿Ya tienes cuenta? <a href="#/login">Inicia sesión</a></p></section>`

const vPerfil = () => {
  const u = usuario()
  const h = u.rol === 'hincha' ? rankHinchas().find((x) => x.id === u.id) : null
  const hist = db.verifs.filter((v) => v.hincha_id === u.id).sort((a, b) => b.fecha - a.fecha).slice(0, 10)
  return `<section class="perfil"><h1>Hola, ${esc(u.nombre)}</h1>
  ${h ? `<div class="tarjeta qr"><h2>Mi código QR</h2><div id="qrbox"></div><p class="token">${esc(u.qr_token)}</p><p>Muéstralo al funcionario en el punto de recolección</p></div>
  <div class="tarjeta resumen"><div><span class="etiqueta">Mi equipo</span><span class="valor">${esc(h.equipo)}</span>
    ${h.puntos > 0 ? `<span class="etiqueta">Puesto ${h.pos_eq} en tu equipo · ${h.pos_gen} en general</span>` : ''}</div>
    <div><span class="etiqueta">Mis puntos</span><span class="puntos">${fmt(h.puntos)}</span></div></div>
  <div class="tarjeta"><h2>Mis últimos reciclajes</h2>${hist.length ? `<div class="tabla-caja"><table><thead><tr><th>Fecha</th><th>Partido</th><th>Residuo</th><th class="num">Pts.</th></tr></thead><tbody>
    ${hist.map((v) => `<tr><td>${fecha(v.fecha, { dateStyle: 'short' })}</td><td>${esc(textoPartido(db.partidos.find((p) => p.id === v.partido_id)))}</td><td>${v.cantidad} × ${esc(db.residuos.find((r) => r.id === v.residuo_id).nombre)}</td><td class="num">+${v.puntos}</td></tr>`).join('')}</tbody></table></div>` : '<p class="apagado" style="margin:0">Aún no tienes reciclajes. Lleva tu material al punto de recolección del estadio.</p>'}</div>` : ''}
  <div class="tarjeta"><dl><dt>Nombre</dt><dd>${esc(u.nombre)}</dd><dt>Correo</dt><dd>${esc(u.email)}</dd><dt>Rol</dt><dd>${u.rol}</dd></dl>
    <div class="fila-botones"><a class="boton" href="#/ranking">Ver ranking</a><button class="boton secundario" data-a="salir">Cerrar sesión</button></div></div></section>`
}

const vRanking = () => {
  const u = usuario()
  const eqs = rankEquipos()
  const hs = rankHinchas().filter((h) => !rk.eq || h.equipo_id === +rk.eq)
  const tabs = `<div class="pestanas"><button class="${rk.vista === 'equipos' ? 'activa' : ''}" data-a="rkVista" data-v="equipos">Equipos</button><button class="${rk.vista === 'hinchas' ? 'activa' : ''}" data-a="rkVista" data-v="hinchas">Hinchas</button></div>`
  const cuerpo = rk.vista === 'equipos'
    ? `<div class="podio">${eqs.slice(0, 3).map((e, i) => `<div class="tarjeta ${i === 0 ? 'primero' : ''}"><span class="lugar">${e.pos}.º puesto</span><strong>${esc(e.nombre)}</strong><span class="pts">${fmt(e.puntos)} pts</span></div>`).join('')}</div>
      <div class="tarjeta tabla-caja"><table><thead><tr><th>Pos.</th><th>Equipo</th><th class="num">Hinchas</th><th class="num">Puntos</th></tr></thead><tbody>
      ${eqs.map((e) => `<tr class="${e.id === u.equipo_id ? 'resaltada' : ''}"><td>${e.pos}</td><td>${esc(e.nombre)} ${e.id === u.equipo_id ? '<span class="apagado">(tu equipo)</span>' : ''}</td><td class="num">${fmt(e.hinchas)}</td><td class="num">${fmt(e.puntos)}</td></tr>`).join('')}</tbody></table></div>`
    : `<label style="max-width:320px">Filtrar por equipo<select data-c="rkEq"><option value="">Todos los equipos</option>${db.equipos.map((e) => `<option value="${e.id}" ${+rk.eq === e.id ? 'selected' : ''}>${esc(e.nombre)}</option>`).join('')}</select></label>
      <div class="tarjeta tabla-caja">${hs.length ? `<table><thead><tr><th>Pos.</th><th>Hincha</th><th>Equipo</th><th class="num">Puntos</th></tr></thead><tbody>
      ${hs.map((h) => `<tr class="${h.id === u.id ? 'resaltada' : ''}"><td>${rk.eq ? h.pos_eq : h.pos_gen}</td><td>${esc(h.nombre)} ${h.id === u.id ? '<span class="apagado">(tú)</span>' : ''}</td><td>${esc(h.equipo)}</td><td class="num">${fmt(h.puntos)}</td></tr>`).join('')}</tbody></table>` : '<p class="apagado">Todavía no hay hinchas en este ranking.</p>'}</div>`
  return `<section class="pagina"><header><h1>Ranking</h1><p>Clasificación por puntos de reciclaje.</p></header>${tabs}${cuerpo}</section>`
}

const vEscaner = () => {
  const rec = db.verifs.slice().sort((a, b) => b.fecha - a.fecha).slice(0, 6)
  const t = db.residuos.find((r) => r.id === es.tipo)
  let izq
  if (es.paso === 'escanear') {
    izq = `<div class="tarjeta"><h2>1. Escanear QR</h2><div class="camara-vacia"><p>La cámara no está disponible en la demo.<br>Escribe o pega el código del QR del hincha.</p></div>
      <form data-f="buscar" style="margin-top:.9rem"><label>Código del QR<input name="codigo" required /></label>
      <p class="error" id="err">${esc(es.err)}</p><div class="fila-botones"><button class="boton">Buscar hincha</button><button type="button" class="boton secundario" data-a="esEjemplo">Usar hincha de ejemplo</button></div></form></div>`
  } else if (es.paso === 'confirmar') {
    izq = `<div class="tarjeta" style="display:grid;gap:.9rem"><h2 style="margin:0">2. Registrar reciclaje</h2>
      <div class="hincha-encontrado"><div class="avatar">${esc(es.hincha.nombre.split(' ').slice(0, 2).map((p) => p[0]).join('').toUpperCase())}</div><div><strong>${esc(es.hincha.nombre)}</strong><br><span class="apagado">${esc(nomEq(es.hincha.equipo_id))}</span></div></div>
      <label>Partido<select data-c="esPartido">${db.partidos.map((p) => `<option value="${p.id}" ${+es.partido === p.id ? 'selected' : ''}>${esc(textoPartido(p))}</option>`).join('')}</select></label>
      <div><span style="font-size:.9rem;font-weight:600">Tipo de residuo</span><div class="opciones" style="margin-top:.3rem">${db.residuos.map((r) => `<button type="button" class="${es.tipo === r.id ? 'activa' : ''}" data-a="esTipo" data-id="${r.id}">${esc(r.nombre)} · ${r.puntos_por_unidad} pts</button>`).join('')}</div></div>
      <label>Cantidad<input type="number" min="1" max="500" value="${es.cant}" data-i="cant" /></label>
      <div class="puntos-a-sumar"><span class="apagado">Puntos a sumar</span><strong id="pts">${fmt(t ? es.cant * t.puntos_por_unidad : 0)}</strong></div>
      <p class="error" id="err">${esc(es.err)}</p>
      <div class="fila-botones"><button class="boton" data-a="esConfirmar">Confirmar</button><button class="boton secundario" data-a="esNuevo">Cancelar</button></div></div>`
  } else {
    izq = `<div class="tarjeta" style="display:grid;gap:.9rem"><h2 style="margin:0">¡Listo!</h2><p class="exito">Se sumaron <b>${fmt(es.res.puntos)} puntos</b> a ${esc(es.hincha.nombre)} y a ${esc(nomEq(es.hincha.equipo_id))}.</p><button class="boton" data-a="esNuevo">Escanear otro hincha</button></div>`
  }
  return `<section class="pagina"><header><h1>Escáner</h1><p>Lee el QR del hincha y registra su reciclaje.</p></header><div class="columnas">${izq}
    <div class="tarjeta"><h2>Registros recientes</h2>${rec.length ? `<div class="tabla-caja"><table><thead><tr><th>Fecha</th><th>Hincha</th><th class="num">Pts.</th></tr></thead><tbody>${rec.map((v) => `<tr><td>${fecha(v.fecha)}</td><td>${esc(db.usuarios.find((u) => u.id === v.hincha_id)?.nombre)}</td><td class="num">+${v.puntos}</td></tr>`).join('')}</tbody></table></div>` : '<p class="apagado">Sin registros todavía.</p>'}</div></div></section>`
}

const tabla = (cols, filas) => `<div class="tarjeta tabla-caja"><table><thead><tr>${cols.map((c) => `<th>${c}</th>`).join('')}</tr></thead><tbody>${filas.map((f) => `<tr>${f.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`
const vAdmin = () => {
  const secs = [['reportes', 'Reportes'], ['equipos', 'Equipos'], ['estadios', 'Estadios'], ['partidos', 'Partidos'], ['residuos', 'Tipos de residuo'], ['usuarios', 'Usuarios']]
  let c = ''
  if (ad === 'reportes') {
    const v = db.verifs, eqs = rankEquipos(), max = Math.max(1, ...eqs.map((e) => e.puntos))
    const cif = [['Verificaciones', v.length], ['Unidades recicladas', v.reduce((a, x) => a + x.cantidad, 0)], ['Puntos entregados', v.reduce((a, x) => a + x.puntos, 0)], ['Hinchas que reciclaron', new Set(v.map((x) => x.hincha_id)).size]]
    c = `<div class="cifras">${cif.map((x) => `<div class="tarjeta cifra"><span>${x[0]}</span><strong>${fmt(x[1])}</strong></div>`).join('')}</div>
      <div class="columnas"><div class="tarjeta tabla-caja"><h2>Puntos por equipo</h2><table><tbody>${eqs.map((e) => `<tr><td>${esc(e.nombre)}</td><td><div class="barra-dato"><span style="width:${(e.puntos / max) * 100}%"></span></div></td><td class="num">${fmt(e.puntos)}</td></tr>`).join('')}</tbody></table></div>
      <div class="tarjeta tabla-caja"><h2>Por tipo de residuo</h2><table><thead><tr><th>Residuo</th><th class="num">Unidades</th><th class="num">Puntos</th></tr></thead><tbody>${db.residuos.map((r) => { const m = v.filter((x) => x.residuo_id === r.id); return `<tr><td>${esc(r.nombre)}</td><td class="num">${fmt(m.reduce((a, x) => a + x.cantidad, 0))}</td><td class="num">${fmt(m.reduce((a, x) => a + x.puntos, 0))}</td></tr>` }).join('')}</tbody></table></div></div>`
  } else if (ad === 'equipos') c = tabla(['Nombre', 'Ciudad'], db.equipos.map((e) => [esc(e.nombre), esc(e.ciudad)]))
  else if (ad === 'estadios') c = tabla(['Nombre', 'Ciudad'], db.estadios.map((e) => [esc(e.nombre), esc(e.ciudad)]))
  else if (ad === 'partidos') c = tabla(['Local', 'Visitante', 'Estadio', 'Fecha'], db.partidos.map((p) => [esc(nomEq(p.local)), esc(nomEq(p.visitante)), esc(db.estadios.find((e) => e.id === p.estadio_id).nombre), fecha(p.fecha)]))
  else if (ad === 'residuos') c = tabla(['Tipo', 'Puntos por unidad'], db.residuos.map((r) => [esc(r.nombre), r.puntos_por_unidad]))
  else c = tabla(['Nombre', 'Correo', 'Rol'], db.usuarios.map((u) => [esc(u.nombre), esc(u.email), `<select data-c="rol" data-id="${u.id}" ${u.id === db.sesion ? 'disabled' : ''}>${['hincha', 'funcionario', 'administrador'].map((r) => `<option ${u.rol === r ? 'selected' : ''}>${r}</option>`).join('')}</select>`]))
  return `<section class="pagina"><header><h1>Panel del administrador</h1><p>Gestiona los datos de la liga y consulta los reportes de reciclaje.</p></header>
    <div class="pestanas">${secs.map((s) => `<button class="${ad === s[0] ? 'activa' : ''}" data-a="adTab" data-v="${s[0]}">${s[1]}</button>`).join('')}</div>${c}
    ${ad !== 'reportes' && ad !== 'usuarios' ? '<p class="apagado">En la demo esta sección es de solo lectura.</p>' : ''}</section>`
}

/* ---------- Rutas ---------- */
const rutas = {
  '': { v: vHome },
  login: { v: vLogin, inv: 1 },
  registro: { v: vRegistro, inv: 1 },
  perfil: { v: vPerfil, auth: 1 },
  ranking: { v: vRanking, auth: 1, ancho: 1 },
  escaner: { v: vEscaner, auth: 1, roles: ['funcionario'], ancho: 1 },
  admin: { v: vAdmin, auth: 1, roles: ['administrador'], ancho: 1 },
}
let ruta = rutas['']
function pintar() {
  $('#barra').innerHTML = barra()
  $('#main').className = 'contenedor' + (ruta.ancho ? ' ancho' : '')
  $('#main').innerHTML = ruta.v()
  const u = usuario()
  if (ruta.v === vPerfil && u.rol === 'hincha') {
    if (window.QRCode) new QRCode($('#qrbox'), { text: u.qr_token, width: 216, height: 216, colorDark: '#1d2b24', colorLight: '#ffffff' })
    else $('#qrbox').textContent = 'No se pudo cargar la librería del QR (revisa tu conexión).'
  }
}
function navegar() {
  const r = location.hash.replace(/^#\/?/, '').split('?')[0]
  ruta = rutas[r] || rutas['']
  const u = usuario()
  if (ruta.auth && !u) return void (location.hash = '#/login')
  if (ruta.roles && !ruta.roles.includes(u.rol)) return void (location.hash = '#' + inicio(u))
  if (ruta.inv && u) return void (location.hash = '#' + inicio(u))
  pintar()
}
window.addEventListener('hashchange', navegar)

/* ---------- Acciones ---------- */
const err = (m) => { const e = $('#err'); if (e) e.textContent = m }
const A = {
  login(d) {
    const u = db.usuarios.find((x) => x.email === d.get('email').trim().toLowerCase() && x.password === d.get('password'))
    if (!u) return err('Correo o contraseña incorrectos')
    db.sesion = u.id; guardar(); location.hash = '#' + inicio(u)
  },
  registro(d) {
    const email = d.get('email').trim().toLowerCase()
    if (d.get('password').length < 8) return err('La contraseña debe tener mínimo 8 caracteres')
    if (d.get('password') !== d.get('confirmar')) return err('Las contraseñas no coinciden')
    if (db.usuarios.some((x) => x.email === email)) return err('Ese correo ya está registrado')
    const u = { id: Date.now(), nombre: d.get('nombre').trim(), email, password: d.get('password'), rol: 'hincha', equipo_id: +d.get('equipo'), qr_token: uid() }
    db.usuarios.push(u); db.sesion = u.id; guardar(); location.hash = '#/perfil'
  },
  buscar(d) {
    const h = db.usuarios.find((u) => u.rol === 'hincha' && u.qr_token === d.get('codigo').trim())
    if (!h) { es.err = 'No se encontró ningún hincha con ese código'; return pintar() }
    Object.assign(es, { paso: 'confirmar', hincha: h, partido: String(db.partidos[1].id), tipo: db.residuos[0].id, cant: 1, err: '' }); pintar()
  },
  salir() { db.sesion = null; guardar(); location.hash = '#/' ; navegar() },
  rkVista(el) { rk.vista = el.dataset.v; pintar() },
  adTab(el) { ad = el.dataset.v; pintar() },
  esEjemplo() { A.buscar(new Map([['codigo', db.usuarios.find((u) => u.rol === 'hincha').qr_token]])) },
  esTipo(el) { es.tipo = +el.dataset.id; pintar() },
  esNuevo() { Object.assign(es, { paso: 'escanear', hincha: null, err: '', res: null }); pintar() },
  esConfirmar() {
    const t = db.residuos.find((r) => r.id === es.tipo)
    if (!(es.cant >= 1)) { es.err = 'La cantidad debe ser al menos 1'; return pintar() }
    const v = { id: uid(), hincha_id: es.hincha.id, partido_id: +es.partido, residuo_id: t.id, cantidad: es.cant, puntos: es.cant * t.puntos_por_unidad, fecha: Date.now() }
    db.verifs.push(v); guardar(); es.res = v; es.paso = 'listo'; es.err = ''; pintar()
  },
}
document.addEventListener('submit', (e) => { const f = e.target.dataset.f; if (f) { e.preventDefault(); A[f](new FormData(e.target)) } })
document.addEventListener('click', (e) => { const b = e.target.closest('[data-a]'); if (b) A[b.dataset.a](b) })
document.addEventListener('change', (e) => {
  const c = e.target.dataset.c
  if (c === 'rkEq') { rk.eq = e.target.value; pintar() }
  else if (c === 'esPartido') es.partido = e.target.value
  else if (c === 'rol') { db.usuarios.find((u) => u.id === +e.target.dataset.id).rol = e.target.value; guardar() }
})
document.addEventListener('input', (e) => {
  if (e.target.dataset.i === 'cant') {
    es.cant = Math.floor(+e.target.value) || 0
    const t = db.residuos.find((r) => r.id === es.tipo)
    $('#pts').textContent = fmt(t ? es.cant * t.puntos_por_unidad : 0)
  }
})

navegar()
