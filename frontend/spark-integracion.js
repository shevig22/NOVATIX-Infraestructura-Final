
function abrirSparkNovatix() {
    if (!usuarioActual || usuarioActual.rol !== "admin") {
        alert("Esta opción es exclusiva para administradores.");
        return;
    }

    const marco = document.getElementById("sparkMarco");
    const iframe = document.getElementById("sparkIframe");

    if (!marco || !iframe) return;

    marco.classList.remove("oculto");

    if (!iframe.getAttribute("src")) {
        iframe.setAttribute("src", "/spark-dashboard.html");
    }

    marco.scrollIntoView({behavior: "smooth", block: "start"});
}

document.addEventListener("click", function(evento) {
    if (evento.target.closest('[onclick*="cerrarSesion"]')) {
        const iframe = document.getElementById("sparkIframe");
        const marco = document.getElementById("sparkMarco");
        if (iframe) iframe.removeAttribute("src");
        if (marco) marco.classList.add("oculto");
    }
}, true);
