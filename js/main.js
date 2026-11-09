import { hayWebGL, inicializarEscena, crearTarjetaFlotante } from "./scene.js";
import { CONFIG } from "./config.js";

const canvas = document.getElementById("escena");
const contenidoAccesible = document.getElementById("contenido-accesible");
const botonGirar = document.getElementById("boton-girar");

// El texto de la tarjeta solo existe como píxeles dentro de la textura 3D.
// Este bloque duplica ese mismo contenido como HTML real para lectores de
// pantalla, buscadores y navegadores sin WebGL — oculto visualmente vía
// .sr-only mientras la escena 3D funcione.
function llenarContenidoAccesible(config, contenedor) {
  function agregar(etiqueta, texto) {
    const el = document.createElement(etiqueta);
    el.textContent = texto;
    contenedor.appendChild(el);
  }
  if (config.foto) {
    const img = document.createElement("img");
    img.src = config.foto;
    img.alt = config.fotoAlt || "";
    contenedor.appendChild(img);
  }
  agregar("h1", `En memoria de ${config.nombre}`);
  agregar("p", `"${config.apodoCarinoso}"`);
  agregar("p", `${config.nacimiento} — ${config.fallecimiento}`);
  (config.mensajeFrontal || []).forEach((linea) => agregar("p", linea));
  if (config.fraseDestacada) agregar("p", config.fraseDestacada);
  if (config.fraseCierre) agregar("p", config.fraseCierre);
  if (config.lugar) agregar("p", config.lugar);
  agregar("blockquote", config.dedicatoria);
  config.mensaje.forEach((linea) => agregar("p", linea));
  agregar("p", config.firma);
}

if (contenidoAccesible) {
  llenarContenidoAccesible(CONFIG, contenidoAccesible);
}

if (!hayWebGL()) {
  canvas.remove();
  if (botonGirar) botonGirar.remove();
  if (contenidoAccesible) {
    contenidoAccesible.classList.remove("sr-only");
  } else {
    document.body.innerHTML =
      '<p style="font-family:sans-serif;text-align:center;margin-top:40vh;">Este navegador no soporta WebGL.</p>';
  }
} else {
  const { scene, camera, renderer, clock } = inicializarEscena(canvas);
  const tarjeta = crearTarjetaFlotante(scene, camera, CONFIG, (mostrandoDorso) => {
    if (botonGirar) {
      botonGirar.textContent = mostrandoDorso ? "‹ Ver frente" : "Ver dorso ›";
      botonGirar.setAttribute("aria-pressed", String(mostrandoDorso));
    }
  });

  if (botonGirar) {
    botonGirar.addEventListener("click", () => {
      tarjeta.alternarVista();
    });
  }

  function animar() {
    requestAnimationFrame(animar);
    const delta = Math.min(clock.getDelta(), 0.1);
    tarjeta.actualizar(delta, clock.elapsedTime);
    renderer.render(scene, camera);
  }
  animar();
}
