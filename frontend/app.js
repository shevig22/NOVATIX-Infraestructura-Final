const API = {
    usuarios: "/usuarios",
    apuestas: "/apuestas",
    partidos: "/partidos",
    dinero:   "/dinero",
    equipos:  "/equipos"
};

let usuarioActual = null;
let partidoSeleccionado = null;
let equipoSeleccionado = null;
let cuotaSeleccionada = null;
let tipoApuestaSeleccionada = null;
let partidosCache = [];
let equiposCache = [];

const $ = (id) => document.getElementById(id);

function esc(valor) {
    return String(valor ?? "").replace(/[&<>"']/g, (c) => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
}

function formatoDinero(valor) {
    return "$" + Number(valor || 0).toLocaleString("es-CO", { maximumFractionDigits: 2 });
}

function mensaje(elemento, texto, ok) {
    elemento.textContent = texto;
    elemento.style.color = ok ? "#16a34a" : "#dc2626";
}

async function api(url, opciones = {}) {
    const config = { ...opciones };
    if (config.body && typeof config.body !== "string") {
        config.body = JSON.stringify(config.body);
        config.headers = { "Content-Type": "application/json", ...(config.headers || {}) };
    }

    let respuesta;
    try {
        respuesta = await fetch(url, config);
    } catch (e) {
        throw new Error("No se pudo conectar con el servidor.");
    }

    const texto = await respuesta.text();
    let datos = null;
    try { datos = texto ? JSON.parse(texto) : null; } catch (e) { /* no era JSON */ }

    if (!respuesta.ok) {
        if (datos && (datos.error || datos.mensaje)) throw new Error(datos.error || datos.mensaje);
        if (respuesta.status === 404 || respuesta.status === 405) {
            throw new Error("Esta función aún no está disponible en el servidor (HTTP " + respuesta.status + ").");
        }
        throw new Error("Error del servidor (HTTP " + respuesta.status + ").");
    }
    if (datos === null && texto) throw new Error("El servidor devolvió una respuesta que no es JSON.");
    return datos;
}

/* ---------- Inicio ---------- */

document.addEventListener("DOMContentLoaded", () => {
    const guardado = localStorage.getItem("usuarioActual");
    if (guardado) {
        try {
            usuarioActual = JSON.parse(guardado);
            mostrarAplicacion();
        } catch (error) {
            localStorage.removeItem("usuarioActual");
            mostrarLogin();
        }
    } else {
        mostrarLogin();
    }

    $("loginForm").addEventListener("submit", iniciarSesion);
    $("registroForm").addEventListener("submit", registrarUsuario);
    $("equipoForm").addEventListener("submit", crearEquipo);
    $("partidoForm").addEventListener("submit", crearPartido);
});

/* ---------- Pantallas ---------- */

function mostrarLogin() {
    $("loginSection").classList.remove("oculto");
    $("registroSection").classList.add("oculto");
    $("appSection").classList.add("oculto");
}

function mostrarRegistro() {
    $("registroError").textContent = "";
    $("registroExito").textContent = "";
    $("loginSection").classList.add("oculto");
    $("registroSection").classList.remove("oculto");
    $("appSection").classList.add("oculto");
}

function mostrarAplicacion() {
    if (!usuarioActual) {
        mostrarLogin();
        return;
    }
    $("loginSection").classList.add("oculto");
    $("registroSection").classList.add("oculto");
    $("appSection").classList.remove("oculto");

    $("nombreUsuarioNav").textContent = usuarioActual.usuario;
    $("nombreUsuario").textContent = usuarioActual.nombre;

    const esAdmin = usuarioActual.rol === "admin";
    $("adminSection").classList.toggle("oculto", !esAdmin);

    cargarSaldo();
    cargarMisApuestas();
    prepararCargaLigera();
    /* Los equipos se cargan manualmente para evitar saturacion. */
}

/* ---------- Sesión ---------- */

async function iniciarSesion(event) {
    if (event) event.preventDefault();

    const usuario = $("loginUsuario").value.trim();
    const password = $("loginPassword").value;
    const error = $("loginError");
    error.textContent = "";

    if (!usuario || !password) {
        error.textContent = "❌ Completa todos los campos.";
        return;
    }

    try {
        const datos = await api(`${API.usuarios}/api/login`, {
            method: "POST",
            body: { usuario, password }
        });
        if (!datos || !datos.valido) throw new Error("Usuario o contraseña incorrectos.");

        usuarioActual = datos.usuario;
        localStorage.setItem("usuarioActual", JSON.stringify(usuarioActual));
        $("loginForm").reset();
        mostrarAplicacion();
    } catch (e) {
        console.error("Error en login:", e);
        error.textContent = "❌ " + e.message;
    }
}

async function registrarUsuario(event) {
    event.preventDefault();
    const error = $("registroError");
    const exito = $("registroExito");
    error.textContent = "";
    exito.textContent = "";

    const body = {
        nombre: $("registroNombre").value.trim(),
        email: $("registroEmail").value.trim(),
        usuario: $("registroUsuario").value.trim(),
        password: $("registroPassword").value
    };

    try {
        await api(`${API.usuarios}/api/usuarios`, { method: "POST", body });
        exito.textContent = "✅ Cuenta creada. Ahora puedes iniciar sesión.";
        $("registroForm").reset();
        setTimeout(mostrarLogin, 1500);
    } catch (e) {
        error.textContent = "❌ " + e.message;
    }
}

function cerrarSesion() {
    usuarioActual = null;
    localStorage.removeItem("usuarioActual");
    cancelarApuesta();
    mostrarLogin();
}

/* ---------- Saldo ---------- */

async function cargarSaldo() {
    try {
        const datos = await api(`${API.dinero}/api/saldo/${usuarioActual.id}`);
        $("saldo").textContent = formatoDinero(datos.saldo_disponible);
    } catch (e) {
        $("saldo").textContent = "No disponible";
    }
}

function mostrarRecarga() {
    $("recargaMensaje").textContent = "";
    $("modalRecarga").style.display = "flex";
}

function cerrarRecarga() {
    $("modalRecarga").style.display = "none";
    $("montoRecarga").value = "";
}

async function recargarSaldo() {
    const monto = Number($("montoRecarga").value);
    const msg = $("recargaMensaje");

    if (!monto || monto < 1000) {
        mensaje(msg, "❌ El monto mínimo es $1.000.", false);
        return;
    }

    try {
        await api(`${API.dinero}/api/recargar`, {
            method: "POST",
            body: { id_usuario: usuarioActual.id, monto }
        });
        mensaje(msg, "✅ Recarga exitosa.", true);
        await cargarSaldo();
        setTimeout(cerrarRecarga, 1000);
    } catch (e) {
        mensaje(msg, "❌ " + e.message, false);
    }
}

/* ---------- Partidos y apuestas ---------- */

async function cargarPartidos() {
    const contenedor = $("partidosContainer");
    try {
        const lista = await api(`${API.partidos}/api/partidos?page=1&limit=20`);
        partidosCache = Array.isArray(lista)
            ? lista.slice(0, 20)
            : (Array.isArray(lista.items) ? lista.items.slice(0, 20) : []);

        if (partidosCache.length === 0) {
            contenedor.innerHTML = "<p>No hay partidos disponibles por ahora.</p>";
            return;
        }

        contenedor.innerHTML = partidosCache.map((p) => {
            const abierto = p.estado === "programado";
            const fecha = new Date(p.fecha_partido).toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short" });
            const escudo = (archivo) => archivo
                ? `<img src="escudos/${esc(archivo)}" alt="" width="48" height="48" onerror="this.style.display='none'"><br>`
                : "";
            const id = Number(p.id);
            const deshabilitado = abierto ? "" : "disabled";
            return `
            <div class="partido-card">
                <h3>${esc(p.equipo_local_nombre)} vs ${esc(p.equipo_visitante_nombre)}</h3>
                <div class="equipos">
                    <div class="equipo">${escudo(p.escudo_local)}${esc(p.equipo_local_nombre)}</div>
                    <div class="vs">VS</div>
                    <div class="equipo">${escudo(p.escudo_visitante)}${esc(p.equipo_visitante_nombre)}</div>
                </div>
                <p class="fecha-partido">📅 ${esc(fecha)} · ${esc(p.estado)}</p>
                <div class="cuotas">
                    <button class="cuota-btn" ${deshabilitado} onclick="seleccionarApuesta(${id}, 'local')">Local<br>${Number(p.cuota_local).toFixed(2)}</button>
                    <button class="cuota-btn" ${deshabilitado} onclick="seleccionarApuesta(${id}, 'empate')">Empate<br>${Number(p.cuota_empate).toFixed(2)}</button>
                    <button class="cuota-btn" ${deshabilitado} onclick="seleccionarApuesta(${id}, 'visitante')">Visitante<br>${Number(p.cuota_visitante).toFixed(2)}</button>
                </div>
            </div>`;
        }).join("");
    } catch (e) {
        contenedor.innerHTML = `<p class="mensaje-error">❌ ${esc(e.message)}</p>`;
    }
}

function seleccionarApuesta(idPartido, tipo) {
    const p = partidosCache.find((x) => Number(x.id) === Number(idPartido));
    if (!p) return;

    partidoSeleccionado = p;
    tipoApuestaSeleccionada = tipo;

    let nombre;
    if (tipo === "local") {
        equipoSeleccionado = p.id_equipo_local;
        nombre = p.equipo_local_nombre;
        cuotaSeleccionada = Number(p.cuota_local);
    } else if (tipo === "visitante") {
        equipoSeleccionado = p.id_equipo_visitante;
        nombre = p.equipo_visitante_nombre;
        cuotaSeleccionada = Number(p.cuota_visitante);
    } else {
        equipoSeleccionado = 0;
        nombre = "Empate";
        cuotaSeleccionada = Number(p.cuota_empate);
    }

    $("equipoApuesta").value = nombre;
    $("cuotaApuesta").value = cuotaSeleccionada.toFixed(2);
    $("partidoSeleccionado").innerHTML =
        `<strong>${esc(p.equipo_local_nombre)} vs ${esc(p.equipo_visitante_nombre)}</strong>`;
    $("apuestaMensaje").textContent = "";
    $("apuestaSection").classList.remove("oculto");
    $("apuestaSection").scrollIntoView({ behavior: "smooth" });
}

function cancelarApuesta() {
    partidoSeleccionado = null;
    equipoSeleccionado = null;
    cuotaSeleccionada = null;
    tipoApuestaSeleccionada = null;
    $("montoApuesta").value = "";
    $("apuestaMensaje").textContent = "";
    $("apuestaSection").classList.add("oculto");
}

async function realizarApuesta() {
    const msg = $("apuestaMensaje");
    const monto = Number($("montoApuesta").value);

    if (!partidoSeleccionado) {
        mensaje(msg, "❌ Selecciona primero un partido.", false);
        return;
    }
    if (!monto || monto < 1000) {
        mensaje(msg, "❌ La apuesta mínima es $1.000.", false);
        return;
    }

    try {
        await api(`${API.apuestas}/api/apuestas`, {
            method: "POST",
            body: {
                user_id: usuarioActual.id,
                part_id: partidoSeleccionado.id,
                equipo_id: equipoSeleccionado,
                tipo: tipoApuestaSeleccionada,
                dinero_apostado: monto,
                cuota: cuotaSeleccionada
            }
        });
        mensaje(msg, "✅ Apuesta realizada.", true);
        await cargarSaldo();
        await cargarMisApuestas();
        setTimeout(cancelarApuesta, 1200);
    } catch (e) {
        mensaje(msg, "❌ " + e.message, false);
    }
}

async function cargarMisApuestas() {
    const contenedor = $("misApuestas");
    try {
        const todas = await api(`${API.apuestas}/api/apuestas/usuario/${usuarioActual.id}`);
        const mias = (Array.isArray(todas) ? todas : [])
            .filter((a) => Number(a.user_id) === Number(usuarioActual.id))
            .reverse();

        if (mias.length === 0) {
            contenedor.innerHTML = "<p>Aún no tienes apuestas.</p>";
            return;
        }

        contenedor.innerHTML = mias.map((a) => {
            const p = partidosCache.find((x) => Number(x.id) === Number(a.part_id));
            const titulo = p ? `${p.equipo_local_nombre} vs ${p.equipo_visitante_nombre}` : `Partido #${a.part_id}`;
            let eleccion = `Equipo #${a.equipo_id}`;
            if (Number(a.equipo_id) === 0) eleccion = "Empate";
            else if (p && Number(a.equipo_id) === Number(p.id_equipo_local)) eleccion = p.equipo_local_nombre;
            else if (p && Number(a.equipo_id) === Number(p.id_equipo_visitante)) eleccion = p.equipo_visitante_nombre;
            const ganancia = Number(a.dinero_apostado) * Number(a.cuota);
            return `
            <div class="apuesta-item">
                <p><strong>${esc(titulo)}</strong></p>
                <p>Elegiste: ${esc(eleccion)}</p>
                <p>Apostado: ${formatoDinero(a.dinero_apostado)} · Cuota: ${Number(a.cuota).toFixed(2)}</p>
                <p>Ganancia posible: ${formatoDinero(ganancia)}</p>
                <p>Fecha: ${esc(new Date(a.fecha).toLocaleString("es-CO"))}</p>
            </div>`;
        }).join("");
    } catch (e) {
        contenedor.innerHTML = `<p class="mensaje-error">❌ ${esc(e.message)}</p>`;
    }
}

/* ---------- Panel de administrador ---------- */

async function crearEquipo(event) {
    event.preventDefault();
    const msg = $("teamError");
    const body = {
        nombre: $("equipoNombre").value.trim(),
        pais: $("equipoPais").value.trim(),
        liga: $("equipoLiga").value.trim(),
        escudo: $("equipoEscudo").value.trim() || null,
        estado: "activo"
    };

    try {
        await api(`${API.equipos}/api/equipos`, { method: "POST", body });
        mensaje(msg, "✅ Equipo creado.", true);
        $("equipoForm").reset();
        cargarEquiposAdmin();
    } catch (e) {
        mensaje(msg, "❌ " + e.message, false);
    }
}

async function cargarEquiposAdmin() {
    const contenedor = $("equiposAdmin");
    try {
        const lista = await api(`${API.equipos}/api/equipos`);
        equiposCache = Array.isArray(lista)
            ? lista
            : (Array.isArray(lista.items) ? lista.items : []);

        const opciones = equiposCache.map((e) => `<option value="${Number(e.id)}">${esc(e.nombre)}</option>`).join("");
        $("partidoLocal").innerHTML = '<option value="">Seleccionar equipo local</option>' + opciones;
        $("partidoVisitante").innerHTML = '<option value="">Seleccionar equipo visitante</option>' + opciones;

        if (equiposCache.length === 0) {
            contenedor.innerHTML = "<p>No hay equipos creados.</p>";
            return;
        }
        contenedor.innerHTML = equiposCache.slice(0, 20).map((e) => `
            <div class="equipo-admin">
                <strong>${esc(e.nombre)}</strong> · ${esc(e.pais)} · ${esc(e.liga)} · ${esc(e.estado)}
                <button class="btn-cancelar" onclick="eliminarEquipo(${Number(e.id)})">Eliminar</button>
            </div>`).join("");
    } catch (e) {
        contenedor.innerHTML = `<p class="mensaje-error">❌ ${esc(e.message)}</p>`;
    }
}

async function eliminarEquipo(id) {
    if (!confirm("¿Eliminar este equipo?")) return;
    try {
        await api(`${API.equipos}/api/equipos/${id}`, { method: "DELETE" });
        cargarEquiposAdmin();
    } catch (e) {
        alert(e.message);
    }
}

async function crearPartido(event) {
    event.preventDefault();
    const msg = $("matchError");

    const local = Number($("partidoLocal").value);
    const visitante = Number($("partidoVisitante").value);
    if (!local || !visitante) {
        mensaje(msg, "❌ Selecciona los dos equipos.", false);
        return;
    }
    if (local === visitante) {
        mensaje(msg, "❌ El local y el visitante deben ser distintos.", false);
        return;
    }

    const body = {
        id_usuario: usuarioActual.id,
        id_equipo_local: local,
        id_equipo_visitante: visitante,
        fecha_partido: $("partidoFecha").value.replace("T", " ") + ":00",
        cuota_local: parseFloat($("cuotaLocal").value),
        cuota_empate: parseFloat($("cuotaEmpate").value),
        cuota_visitante: parseFloat($("cuotaVisitante").value)
    };

    try {
        await api(`${API.partidos}/api/partidos`, { method: "POST", body });
        mensaje(msg, "✅ Partido creado.", true);
        $("partidoForm").reset();
        cargarPartidos();
    } catch (e) {
        mensaje(msg, "❌ " + e.message, false);
    }
}


/* NOVATIX - CARGA LIGERA DE EMERGENCIA */
function prepararCargaLigera() {
    const contenedor = document.getElementById("partidosContainer");
    if (!contenedor) return;

    contenedor.innerHTML = "";

    const aviso = document.createElement("div");
    aviso.style.gridColumn = "1 / -1";
    aviso.style.padding = "20px";
    aviso.style.textAlign = "center";

    const titulo = document.createElement("p");
    titulo.textContent =
        "Los partidos se cargan bajo demanda para mejorar el rendimiento.";

    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = "btn-principal";
    boton.textContent = "Ver primeros 20 partidos";

    boton.addEventListener("click", async () => {
        if (boton.disabled) return;
        boton.disabled = true;
        boton.textContent = "Cargando partidos...";

        try {
            await cargarPartidos();
        } finally {
            boton.disabled = false;
            boton.textContent = "Ver primeros 20 partidos";
        }
    });

    aviso.appendChild(titulo);
    aviso.appendChild(boton);
    contenedor.appendChild(aviso);
}
