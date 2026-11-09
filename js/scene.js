import * as THREE from "three";
import { RoundedBoxGeometry } from "./vendor/three/examples/jsm/geometries/RoundedBoxGeometry.js";

const ORO = "#c9a227"; // solo para flor de lis/marco decorativos — no usar en texto, falla contraste AA
const ORO_OSCURO = "#84661e"; // ajustado desde #8a6a1f para llegar a 4.5:1 sobre el fondo de tarjeta
const ORO_TEXTO = "#806719"; // variante de ORO con 4.5:1 de contraste, para texto real (no decorativo)
const TINTA = "#3a2a10";
const ESCALA_MINIMA_TEXTO = 0.6; // nunca encoger el texto más allá de este punto; preferible recortar que ilegible

export function hayWebGL() {
  try {
    const canvas = document.createElement("canvas");
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
    );
  } catch (e) {
    return false;
  }
}

export function inicializarEscena(canvas) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf7f3e7); // variante clara del Pantone 11-0106 TCX

  const camera = new THREE.PerspectiveCamera(
    40,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  );
  camera.position.set(0, 0, 6);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  scene.add(new THREE.AmbientLight(0xffffff, 0.9));

  const luzPrincipal = new THREE.DirectionalLight(0xffffff, 0.55);
  luzPrincipal.position.set(2, 3, 4);
  scene.add(luzPrincipal);

  const luzRelleno = new THREE.DirectionalLight(0xffffff, 0.25);
  luzRelleno.position.set(-3, -1, 2);
  scene.add(luzRelleno);

  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  return { scene, camera, renderer, clock: new THREE.Clock() };
}

function crearTexturaHaze() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  const degradado = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  degradado.addColorStop(0, "rgba(255,255,255,0.8)");
  degradado.addColorStop(0.5, "rgba(255,255,255,0.3)");
  degradado.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = degradado;
  ctx.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(canvas);
}

function crearTexturaNube() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 320;
  const ctx = canvas.getContext("2d");
  for (let i = 0; i < 7; i++) {
    const cx = 90 + Math.random() * 330;
    const cy = 150 + (Math.random() - 0.5) * 70;
    const r = 55 + Math.random() * 65;
    const degradado = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    degradado.addColorStop(0, "rgba(255,255,255,0.85)");
    degradado.addColorStop(0.6, "rgba(255,255,255,0.45)");
    degradado.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = degradado;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  }
  return new THREE.CanvasTexture(canvas);
}

// Ancho/alto visibles por la cámara a una profundidad (z) del mundo dada.
// Así el cielo y las nubes siempre cubren toda la pantalla, sea cual sea
// el tamaño de la tarjeta o el aspecto de la pantalla — antes se dibujaban
// a un tamaño relativo a la tarjeta y quedaban casi tapadas detrás de ella.
function tamanoVisibleEnProfundidad(camera, zMundo) {
  const distancia = Math.max(0.1, camera.position.z - zMundo);
  const vFov = THREE.MathUtils.degToRad(camera.fov);
  const altoVisible = 2 * distancia * Math.tan(vFov / 2);
  const anchoVisible = altoVisible * camera.aspect;
  return { anchoVisible, altoVisible };
}

function crearBrumaCeleste(scene, camera) {
  // Grupo aislado: NO es hijo del contenedor que gira. Solo copiamos la
  // posición vertical (el flote) cada frame; nunca su rotación — la misma
  // lección del aura anterior, para que nada se descentre al girar la tarjeta.
  const grupoBruma = new THREE.Group();

  const Z_CIELO = -3.2;

  const cielo = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: crearTexturaHaze(),
      color: 0xa9d2f0,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
    })
  );
  cielo.position.z = Z_CIELO;
  grupoBruma.add(cielo);

  const capas = [
    { z: -2.4, y: 0.55, velocidad: 0.03, opacidad: 0.55 },
    { z: -1.7, y: -0.5, velocidad: 0.045, opacidad: 0.6 },
  ].map((config) => {
    const nube = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: crearTexturaNube(),
        color: 0xf2f8fd,
        transparent: true,
        opacity: config.opacidad,
        depthWrite: false,
      })
    );
    nube.position.z = config.z;
    grupoBruma.add(nube);
    return { nube, ...config };
  });

  function actualizar(tiempo) {
    const cieloTamano = tamanoVisibleEnProfundidad(camera, Z_CIELO);
    cielo.scale.set(cieloTamano.anchoVisible * 1.25, cieloTamano.altoVisible * 1.25, 1);
    cielo.material.opacity = 0.45 + Math.sin(tiempo * 0.25) * 0.08;

    for (const capa of capas) {
      const tamano = tamanoVisibleEnProfundidad(camera, capa.z);
      capa.nube.scale.set(tamano.anchoVisible * 0.95, tamano.altoVisible * 0.42, 1);
      capa.nube.position.y = tamano.altoVisible * capa.y;
      // El recorrido va de -anchoVisible a +anchoVisible (no solo ±0.85):
      // la nube mide 0.95×anchoVisible de ancho (mitad = 0.475), así que a
      // ±1.0×anchoVisible su borde más cercano (0.525) ya quedó fuera de la
      // mitad visible (0.5) en ambos extremos — el salto de avance=1 a 0
      // ocurre con la nube completamente fuera de cuadro, sin "teletransporte" visible.
      const avance = (tiempo * capa.velocidad) % 1;
      capa.nube.position.x = avance * tamano.anchoVisible * 2 - tamano.anchoVisible;
    }
  }

  scene.add(grupoBruma);
  return { grupoBruma, actualizar };
}

function dividirLineas(ctx, texto, anchoMax) {
  const palabras = String(texto).split(" ");
  const lineas = [];
  let linea = "";
  for (const palabra of palabras) {
    const prueba = linea ? `${linea} ${palabra}` : palabra;
    if (ctx.measureText(prueba).width > anchoMax && linea) {
      lineas.push(linea);
      linea = palabra;
    } else {
      linea = prueba;
    }
  }
  if (linea) lineas.push(linea);
  return lineas;
}

function dibujarMarcoDorado(ctx, w, h) {
  ctx.strokeStyle = "rgba(201, 162, 39, 0.8)";
  ctx.lineWidth = 2;
  ctx.strokeRect(34, 34, w - 68, h - 68);

  ctx.fillStyle = ORO;
  for (const [ex, ey] of [[34, 34], [w - 34, 34], [34, h - 34], [w - 34, h - 34]]) {
    ctx.beginPath();
    ctx.arc(ex, ey, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

function dibujarFloron(ctx, x, y, color, tamano) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = `${tamano}px Georgia, serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("✦", x, y);
  ctx.restore();
}

// Dibuja el enlace "ver dorso/frente" como parte del propio texto de la
// tarjeta (no como un botón de HTML encima) — así hereda automáticamente
// rotación, flote y perspectiva, igual que el resto del contenido. Canvas
// no subraya texto nativamente, así que el subrayado se traza a mano.
// Devuelve la zona clicable en coordenadas locales de canvas (antes de
// aplicar el desplazamiento de centrado vertical), para que crearTexturaCara
// pueda convertirla a fracciones 0–1 del canvas (zonaEnFracciones).
function dibujarEnlaceVoltear(ctx, w, y, escala, dibujar, etiqueta) {
  y += 20 * escala;
  ctx.font = `italic ${18 * escala}px Georgia, serif`;
  const anchoEtiqueta = ctx.measureText(etiqueta).width;

  if (dibujar) {
    ctx.fillStyle = ORO_TEXTO;
    ctx.fillText(etiqueta, w / 2, y);
    ctx.strokeStyle = ORO_TEXTO;
    ctx.lineWidth = Math.max(1, escala);
    ctx.beginPath();
    ctx.moveTo(w / 2 - anchoEtiqueta / 2, y + 5 * escala);
    ctx.lineTo(w / 2 + anchoEtiqueta / 2, y + 5 * escala);
    ctx.stroke();
  }

  const relleno = 20 * escala; // zona táctil más generosa que el texto visible
  const zonaEnlace = {
    x0: w / 2 - anchoEtiqueta / 2 - relleno,
    x1: w / 2 + anchoEtiqueta / 2 + relleno,
    y0: y - 18 * escala - relleno,
    y1: y + 8 * escala + relleno,
  };

  y += 18 * escala * 1.5;
  return { y, zonaEnlace };
}

// Dibuja (o solo mide, si dibujar=false) el contenido del frente a una
// escala dada. Se llama primero a escala 1 para medir el alto real que
// ocupa el texto de esta tarjeta en particular, y si no cabe en el área
// disponible se vuelve a llamar con una escala menor — así el texto
// nunca se desborda, sea corto o largo el contenido de config.js.
function diseñarFrente(ctx, w, config, escala, dibujar) {
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  const anchoTexto = w * 0.78;
  let y = 0;

  ctx.font = `italic ${34 * escala}px Georgia, serif`;
  if (dibujar) {
    ctx.fillStyle = ORO_OSCURO;
    ctx.fillText("En memoria de", w / 2, y);
  }
  y += 34 * escala * 1.3 + 28 * escala;

  if (dibujar) dibujarFloron(ctx, w / 2, y, ORO, 22 * escala);
  y += 22 * escala * 1.5 + 24 * escala;

  ctx.font = `bold ${58 * escala}px Georgia, serif`;
  const lineasNombre = dividirLineas(ctx, config.nombre, w * 0.86);
  if (dibujar) {
    const gradiente = ctx.createLinearGradient(w * 0.2, 0, w * 0.8, 0);
    gradiente.addColorStop(0, ORO_OSCURO);
    gradiente.addColorStop(1, ORO_TEXTO);
    ctx.fillStyle = gradiente;
    lineasNombre.forEach((l, i) => ctx.fillText(l, w / 2, y + i * 60 * escala));
  }
  y += lineasNombre.length * 60 * escala + 24 * escala;

  ctx.font = `italic ${27 * escala}px Georgia, serif`;
  if (dibujar) {
    ctx.fillStyle = ORO_OSCURO;
    ctx.fillText(`"${config.apodoCarinoso}"`, w / 2, y);
  }
  y += 27 * escala * 1.4 + 20 * escala;

  ctx.font = `${25 * escala}px Georgia, serif`;
  if (dibujar) {
    ctx.fillStyle = TINTA;
    ctx.fillText(`${config.nacimiento}  —  ${config.fallecimiento}`, w / 2, y);
  }
  y += 25 * escala * 1.5 + 28 * escala;

  if (dibujar) dibujarFloron(ctx, w / 2, y, ORO, 22 * escala);
  y += 22 * escala * 1.5 + 26 * escala;

  if (Array.isArray(config.mensajeFrontal)) {
    ctx.font = `${21 * escala}px Georgia, serif`;
    for (const linea of config.mensajeFrontal) {
      const lineasMsg = dividirLineas(ctx, linea, anchoTexto);
      if (dibujar) {
        ctx.fillStyle = TINTA;
        lineasMsg.forEach((l, i) => ctx.fillText(l, w / 2, y + i * 28 * escala));
      }
      y += lineasMsg.length * 28 * escala + 16 * escala;
    }
  }

  if (config.fraseDestacada) {
    y += 8 * escala;
    ctx.font = `bold ${23 * escala}px Georgia, serif`;
    const lineasDestacada = dividirLineas(ctx, config.fraseDestacada, anchoTexto * 0.94);
    if (dibujar) {
      ctx.fillStyle = ORO_OSCURO;
      lineasDestacada.forEach((l, i) => ctx.fillText(l, w / 2, y + i * 30 * escala));
    }
    y += lineasDestacada.length * 30 * escala + 22 * escala;
  }

  if (config.fraseCierre) {
    ctx.font = `italic ${22 * escala}px Georgia, serif`;
    const lineasCierre = dividirLineas(ctx, config.fraseCierre, anchoTexto);
    if (dibujar) {
      ctx.fillStyle = TINTA;
      lineasCierre.forEach((l, i) => ctx.fillText(l, w / 2, y + i * 29 * escala));
    }
    y += lineasCierre.length * 29 * escala + 20 * escala;
  }

  if (config.lugar) {
    ctx.font = `${19 * escala}px Georgia, serif`;
    if (dibujar) {
      ctx.fillStyle = ORO_OSCURO;
      ctx.fillText(config.lugar, w / 2, y);
    }
    y += 19 * escala * 1.4;
  }

  return dibujarEnlaceVoltear(ctx, w, y, escala, dibujar, "Ver dorso ›");
}

function diseñarDorso(ctx, w, config, escala, dibujar) {
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  const anchoTexto = w * 0.8;
  let y = 0;

  if (dibujar) dibujarFloron(ctx, w / 2, y, ORO, 22 * escala);
  y += 22 * escala * 1.5 + 26 * escala;

  ctx.font = `bold ${25 * escala}px Georgia, serif`;
  const lineasDed = dividirLineas(ctx, config.dedicatoria, anchoTexto);
  if (dibujar) {
    ctx.fillStyle = TINTA;
    lineasDed.forEach((l, i) => ctx.fillText(l, w / 2, y + i * 32 * escala));
  }
  y += lineasDed.length * 32 * escala + 30 * escala;

  ctx.font = `${21 * escala}px Georgia, serif`;
  for (const linea of config.mensaje) {
    const lineasMsg = dividirLineas(ctx, linea, anchoTexto);
    if (dibujar) {
      ctx.fillStyle = "#2a1d0c";
      lineasMsg.forEach((l, i) => ctx.fillText(l, w / 2, y + i * 28 * escala));
    }
    y += lineasMsg.length * 28 * escala + 16 * escala;
  }

  y += 10 * escala;
  if (dibujar) dibujarFloron(ctx, w / 2, y, ORO, 22 * escala);
  y += 22 * escala * 1.5 + 22 * escala;

  ctx.font = `bold ${23 * escala}px Georgia, serif`;
  if (dibujar) {
    ctx.fillStyle = ORO_OSCURO;
    ctx.fillText(config.firma, w / 2, y);
  }
  y += 23 * escala * 1.3;

  return dibujarEnlaceVoltear(ctx, w, y, escala, dibujar, "‹ Ver frente");
}

function dibujarFondoTarjeta(ctx, w, h) {
  ctx.fillStyle = "#f0ebd7";
  ctx.fillRect(0, 0, w, h);
  dibujarMarcoDorado(ctx, w, h);
}

// Convierte una zona clicable en coordenadas locales de canvas (antes del
// desplazamiento de centrado vertical) a fracciones 0–1 del canvas completo
// — independiente de resolución, con offsetSuperior ya aplicado.
function zonaEnFracciones(zonaLocal, offsetSuperior, w, h) {
  return {
    x0: zonaLocal.x0 / w,
    x1: zonaLocal.x1 / w,
    y0: (zonaLocal.y0 + offsetSuperior) / h,
    y1: (zonaLocal.y1 + offsetSuperior) / h,
  };
}

// Frente y dorso comparten el mismo flujo: canvas 720×1152, fondo, medir el
// alto real del contenido (dibujar=false) para escalarlo si no cabe, y recién
// entonces dibujar. diseñarFn es diseñarFrente o diseñarDorso.
function crearTexturaCara(config, diseñarFn, margenSuperiorFrac, areaUtilFrac) {
  const canvas = document.createElement("canvas");
  canvas.width = 720;
  canvas.height = 1152; // mantiene la proporción 720/1152 = ancho/alto = 2/3.2, igual en ambas caras
  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;

  dibujarFondoTarjeta(ctx, w, h);

  const margenSuperior = h * margenSuperiorFrac;
  const areaUtil = h * areaUtilFrac;

  const { y: alturaBase } = diseñarFn(ctx, w, config, 1, false);
  const escala = Math.max(ESCALA_MINIMA_TEXTO, Math.min(1, areaUtil / alturaBase));
  const { y: alturaFinal, zonaEnlace: zonaLocal } = diseñarFn(ctx, w, config, escala, false);

  const offsetSuperior = margenSuperior + Math.max(0, (areaUtil - alturaFinal) / 2);
  ctx.save();
  ctx.translate(0, offsetSuperior);
  diseñarFn(ctx, w, config, escala, true);
  ctx.restore();

  const textura = new THREE.CanvasTexture(canvas);
  textura.colorSpace = THREE.SRGBColorSpace;
  const zonaEnlace = zonaEnFracciones(zonaLocal, offsetSuperior, w, h);
  return { textura, zonaEnlace };
}

function crearSombraSuave() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  const degradado = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  degradado.addColorStop(0, "rgba(90,78,48,0.22)");
  degradado.addColorStop(1, "rgba(90,78,48,0)");
  ctx.fillStyle = degradado;
  ctx.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(canvas);
}

function ajustarCamaraResponsiva(camera, ancho, alto, margen = 1.45) {
  function aplicar() {
    const aspecto = window.innerWidth / window.innerHeight;
    const vFov = THREE.MathUtils.degToRad(camera.fov);
    const distanciaPorAlto = (alto * margen) / (2 * Math.tan(vFov / 2));
    const distanciaPorAncho = (ancho * margen) / (2 * Math.tan(vFov / 2) * aspecto);
    camera.position.z = Math.max(distanciaPorAlto, distanciaPorAncho);
  }
  aplicar();
  window.addEventListener("resize", aplicar);
  window.addEventListener("orientationchange", () => setTimeout(aplicar, 150));
}

export function crearTarjetaFlotante(scene, camera, config, onCambioVista) {
  const ancho = 2.0;
  const alto = 3.2; // más alta que el boceto original: el contenido real del frente no cabía
  const grosor = 0.08;
  const radioEsquina = 0.14;

  ajustarCamaraResponsiva(camera, ancho, alto, 1.2);

  const grupo = new THREE.Group();
  scene.add(grupo);

  const geometria = new RoundedBoxGeometry(ancho, alto, grosor, 7, radioEsquina);
  const material = new THREE.MeshStandardMaterial({
    color: 0xf0ebd7, // Pantone 11-0106 TCX (Sweet Corn / off-white)
    roughness: 0.85,
    metalness: 0,
  });
  const tarjeta = new THREE.Mesh(geometria, material);
  grupo.add(tarjeta);

  const altoTextoFrente = alto * 0.94;
  const { textura: texturaFrente, zonaEnlace: zonaEnlaceFrente } = crearTexturaCara(
    config,
    diseñarFrente,
    0.08,
    0.86
  );
  const frente = new THREE.Mesh(
    new THREE.PlaneGeometry(ancho * 0.94, altoTextoFrente),
    new THREE.MeshBasicMaterial({ map: texturaFrente })
  );
  frente.position.z = grosor / 2 + 0.001;
  grupo.add(frente);

  const { textura: texturaDorso, zonaEnlace: zonaEnlaceDorso } = crearTexturaCara(
    config,
    diseñarDorso,
    0.1,
    0.82
  );
  const dorso = new THREE.Mesh(
    new THREE.PlaneGeometry(ancho * 0.94, alto * 0.94),
    new THREE.MeshBasicMaterial({ map: texturaDorso })
  );
  dorso.rotation.y = Math.PI;
  dorso.position.z = -(grosor / 2 + 0.001);
  grupo.add(dorso);

  const sombra = new THREE.Mesh(
    new THREE.PlaneGeometry(ancho * 1.3, alto * 0.5),
    new THREE.MeshBasicMaterial({
      map: crearSombraSuave(),
      transparent: true,
      depthWrite: false,
    })
  );
  sombra.position.set(0, -alto * 0.75, -1.2);
  scene.add(sombra);

  // La bruma se crea al final, totalmente separada del contenedor que gira.
  const bruma = crearBrumaCeleste(scene, camera);

  // --- Arrastrar para girar, con regreso a la posición de reposo ---
  let arrastre = { x: 0, y: 0 };
  let arrastrando = false;
  let inicio = { x: 0, y: 0 };
  let inicioTiempo = 0;
  let distanciaMaxima = 0;

  // Objetivo de giro del enlace "ver dorso/frente" — se suma al balanceo y al
  // arrastre, nunca los reemplaza, así el enlace y el arrastre conviven.
  let objetivoGiro = 0;
  // onCambioVista se notifica aquí, sin importar si el volteo vino del botón
  // de respaldo (main.js) o del tap sobre el enlace dibujado en la textura
  // (manejarTap más abajo) — así #boton-girar nunca queda con un label desincronizado.
  function alternarVista() {
    objetivoGiro = objetivoGiro === 0 ? Math.PI : 0;
    const mostrandoDorso = objetivoGiro !== 0;
    if (onCambioVista) onCambioVista(mostrandoDorso);
    return mostrandoDorso;
  }

  // El enlace "Ver dorso ›" / "‹ Ver frente" vive dentro de la propia
  // textura (dibujarEnlaceVoltear), no como botón de HTML — así hereda
  // rotación, flote y perspectiva exactamente igual que el resto del
  // texto, en vez de tener que perseguir al objeto cada frame. Un tap
  // (sin arrastre) lanza un rayo contra frente/dorso; si cae dentro de
  // zonaEnlaceFrente/zonaEnlaceDorso, activa el mismo alternarVista().
  const raycaster = new THREE.Raycaster();
  const puntero = new THREE.Vector2();
  function manejarTap(e) {
    puntero.x = (e.clientX / window.innerWidth) * 2 - 1;
    puntero.y = -(e.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(puntero, camera);
    const impactos = raycaster.intersectObjects([frente, dorso]);
    if (impactos.length === 0 || !impactos[0].uv) return;

    const { uv, object } = impactos[0];
    const zona = object === frente ? zonaEnlaceFrente : zonaEnlaceDorso;
    const xFraccion = uv.x;
    const yFraccion = 1 - uv.y; // UV v=1 arriba → misma convención que el canvas (y=0 arriba)

    if (xFraccion >= zona.x0 && xFraccion <= zona.x1 && yFraccion >= zona.y0 && yFraccion <= zona.y1) {
      alternarVista();
    }
  }

  function alPresionar(e) {
    arrastrando = true;
    inicio.x = e.clientX;
    inicio.y = e.clientY;
    inicioTiempo = performance.now();
    distanciaMaxima = 0;
  }
  function alMover(e) {
    if (!arrastrando) return;
    const dx = e.clientX - inicio.x;
    const dy = e.clientY - inicio.y;
    distanciaMaxima = Math.max(distanciaMaxima, Math.hypot(dx, dy));
    arrastre.y = THREE.MathUtils.clamp(dx * 0.008, -1.1, 1.1);
    arrastre.x = THREE.MathUtils.clamp(-dy * 0.006, -0.55, 0.55);
  }
  function alSoltar(e) {
    arrastrando = false;
    // Tap = movimiento mínimo y suelta rápida; si no, fue un arrastre para
    // girar la tarjeta y no debe activar el enlace.
    if (distanciaMaxima < 6 && performance.now() - inicioTiempo < 300) {
      manejarTap(e);
    }
  }

  window.addEventListener("pointerdown", alPresionar);
  window.addEventListener("pointermove", alMover);
  window.addEventListener("pointerup", alSoltar);

  // Fracción del camino que queda por recorrer tras 1 segundo, sin importar
  // el frame rate del dispositivo — mismo patrón que el resorte del arrastre
  // (1 - K^delta), para que el giro y el flote se sientan igual de fluidos
  // en una pantalla de 60Hz que en una de 120Hz. Valores más chicos = llega
  // más rápido al objetivo; se eligieron más lentos que el 0.08/0.05 fijos
  // que había antes, para un acomodo más sereno.
  const SUAVIZADO_GIRO = 0.02;
  const SUAVIZADO_FLOTE = 0.07;
  // Antes en 0.001 (99.9% recorrido en 1s): volvía de golpe, como un "snap".
  // Con 0.03 el acomodo se siente más como dejarse ir que como frenar en seco.
  const SUAVIZADO_RESORTE_ARRASTRE = 0.03;

  function actualizar(delta, tiempo) {
    if (!arrastrando) {
      // Resorte: al soltar, el desplazamiento del arrastre vuelve a cero
      // y la tarjeta recupera su balanceo de reposo original.
      const suavizadoResorte = 1 - Math.pow(SUAVIZADO_RESORTE_ARRASTRE, delta);
      arrastre.x = THREE.MathUtils.lerp(arrastre.x, 0, suavizadoResorte);
      arrastre.y = THREE.MathUtils.lerp(arrastre.y, 0, suavizadoResorte);
    }

    const balanceoReposoY = Math.sin(tiempo * 0.3) * 0.18;
    const balanceoReposoX = Math.sin(tiempo * 0.22 + 1.4) * 0.05;

    const suavizadoGiro = 1 - Math.pow(SUAVIZADO_GIRO, delta);
    grupo.rotation.y = THREE.MathUtils.lerp(grupo.rotation.y, objetivoGiro + balanceoReposoY + arrastre.y, suavizadoGiro);
    grupo.rotation.x = THREE.MathUtils.lerp(grupo.rotation.x, balanceoReposoX + arrastre.x, suavizadoGiro);

    const flote = Math.sin(tiempo * 0.55) * 0.09 + Math.sin(tiempo * 0.33) * 0.03;
    grupo.position.y = THREE.MathUtils.lerp(grupo.position.y, flote, 1 - Math.pow(SUAVIZADO_FLOTE, delta));

    sombra.scale.setScalar(1 - grupo.position.y * 0.15);
    sombra.material.opacity = 0.9 - Math.abs(grupo.position.y) * 0.4;

    // Solo se copia la posición (el flote), nunca la rotación del contenedor.
    bruma.grupoBruma.position.y = grupo.position.y;
    bruma.actualizar(tiempo);
  }

  return { grupo, tarjeta, actualizar, alternarVista };
}
