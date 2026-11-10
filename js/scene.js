import * as THREE from "three";
import { RoundedBoxGeometry } from "./vendor/three/examples/jsm/geometries/RoundedBoxGeometry.js";

const ORO = "#c9a227"; // solo para flor de lis/marco decorativos — no usar en texto, falla contraste AA
const ORO_OSCURO = "#84661e"; // 4.5:1 de contraste sobre el fondo de la tarjeta — no bajarlo
const ORO_TEXTO = "#806719"; // variante de ORO con 4.5:1 de contraste, para texto real (no decorativo)
const TINTA = "#3a2a10";
const ESCALA_MINIMA_TEXTO = 0.6; // nunca encoger el texto más allá de este punto; preferible recortar que ilegible

// Límites del zoom de pellizco, como factor sobre la distancia de cámara ya
// ajustada por ajustarCamaraResponsiva — <1 acerca (tarjeta más grande en
// pantalla), >1 aleja. No se deja llegar a 0 ni valores muy chicos: la
// cámara atravesaría el plano cercano (near=0.1) y la tarjeta desaparecería.
const ZOOM_MINIMO = 0.55;
const ZOOM_MAXIMO = 1.5;

// Margen de contenido para el ancho de párrafo del frente (mensaje, frases).
const MARGEN_CONTENIDO = 0.11; // fracción de w a cada lado
const MARGEN_MARCO = 34; // inset del marco decorativo (dibujarMarcoDorado) — no confundir con MARGEN_CONTENIDO

// Foto del frente: rectángulo de esquinas redondeadas con marco dorado fino.
// ANCHO_FOTO === ALTO_FOTO a propósito — la foto fuente es cuadrada
// (1254×1254); si no coinciden, la escala no uniforme de crearTarjetaFlotante
// la estira. ANCHO_FOTO/ALTO_FOTO son el footprint EXTERIOR del marco
// dorado, no el de la foto (el marco sobresale, ver SOBRESALIDA_MARCO_FOTO).
// Fracciones fijas de w, NO se multiplican por escala, para que la foto
// nunca se achique si el resto del contenido fuerza una escala más chica.
const ANCHO_FOTO = 0.34;
const ALTO_FOTO = 0.34;
const SOBRESALIDA_MARCO_FOTO = 1.06;
const RADIO_ESQUINA_FOTO = 0.14; // fracción del semi-ancho/semi-alto unitario de la forma (ver formaRectanguloRedondeado)

// Escala de espaciado del frente, en vez de números sueltos (8, 20, 22, 26...)
// sin un criterio claro entre ellos. Se multiplican por escala igual que el
// resto del archivo.
const ESPACIO_PEQUENO = 21; // entre elementos directamente relacionados (apodo↔fechas, párrafos de un mismo mensaje)
const ESPACIO_MEDIO = 33; // entre secciones distintas del frente
const ESPACIO_GRANDE = 38; // antes/después de los anclas visuales principales (encabezado, fechas)

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

// Ancho/alto visibles por la cámara a una profundidad (z) del mundo dada —
// la usa el paneo de pellizco para convertir píxeles de pantalla a unidades
// de mundo al nivel de la tarjeta (z=0).
function tamanoVisibleEnProfundidad(camera, zMundo) {
  const distancia = Math.max(0.1, camera.position.z - zMundo);
  const vFov = THREE.MathUtils.degToRad(camera.fov);
  const altoVisible = 2 * distancia * Math.tan(vFov / 2);
  const anchoVisible = altoVisible * camera.aspect;
  return { anchoVisible, altoVisible };
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
  ctx.strokeRect(MARGEN_MARCO, MARGEN_MARCO, w - MARGEN_MARCO * 2, h - MARGEN_MARCO * 2);

  ctx.fillStyle = ORO;
  const esquinas = [
    [MARGEN_MARCO, MARGEN_MARCO],
    [w - MARGEN_MARCO, MARGEN_MARCO],
    [MARGEN_MARCO, h - MARGEN_MARCO],
    [w - MARGEN_MARCO, h - MARGEN_MARCO],
  ];
  for (const [ex, ey] of esquinas) {
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

// Dibuja el enlace "ver dorso/frente" dentro de la propia textura de la
// tarjeta, no como un botón de HTML encima — así hereda rotación, flote y
// perspectiva igual que el resto del contenido (un overlay de HTML no lo
// haría). Canvas no subraya texto nativamente, así que el subrayado se traza
// a mano. Devuelve la zona clicable en coordenadas locales de canvas (antes
// del desplazamiento de centrado vertical); crearTexturaCara la convierte a
// fracciones 0–1 (zonaEnFracciones).
function dibujarEnlaceVoltear(ctx, w, y, escala, dibujar, etiqueta) {
  y += 26 * escala;
  ctx.font = `italic ${24 * escala}px Georgia, serif`;
  const anchoEtiqueta = ctx.measureText(etiqueta).width;

  if (dibujar) {
    ctx.fillStyle = ORO_TEXTO;
    ctx.fillText(etiqueta, w / 2, y);
    ctx.strokeStyle = ORO_TEXTO;
    ctx.lineWidth = Math.max(1, escala);
    ctx.beginPath();
    ctx.moveTo(w / 2 - anchoEtiqueta / 2, y + 7 * escala);
    ctx.lineTo(w / 2 + anchoEtiqueta / 2, y + 7 * escala);
    ctx.stroke();
  }

  const relleno = 26 * escala; // zona táctil más generosa que el texto visible
  const zonaEnlace = {
    x0: w / 2 - anchoEtiqueta / 2 - relleno,
    x1: w / 2 + anchoEtiqueta / 2 + relleno,
    y0: y - 24 * escala - relleno,
    y1: y + 10 * escala + relleno,
  };

  y += 24 * escala * 1.5;
  return { y, zonaEnlace };
}

// Dibuja (o solo mide, si dibujar=false) el contenido del frente a una
// escala dada. Se llama primero a escala 1 para medir el alto real que
// ocupa, y si no cabe se vuelve a llamar con una escala menor.
function diseñarFrente(ctx, w, config, escala, dibujar) {
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  const anchoTexto = w * (1 - MARGEN_CONTENIDO * 2);
  let y = 0;

  ctx.font = `italic ${45 * escala}px Georgia, serif`;
  if (dibujar) {
    ctx.fillStyle = ORO_OSCURO;
    ctx.fillText("En memoria de", w / 2, y);
  }
  y += 45 * escala * 1.3 + ESPACIO_GRANDE * escala;

  // Foto y nombre apilados, centrados en w/2, cada uno como un bloque
  // independiente del flujo vertical — igual que todo lo demás del frente.
  const anchoMarcoFoto = w * ANCHO_FOTO;
  const altoMarcoFoto = w * ALTO_FOTO;
  const mitadAnchoFoto = anchoMarcoFoto / 2 / SOBRESALIDA_MARCO_FOTO; // tamaño real de la foto (sin el marco)
  const mitadAltoFoto = altoMarcoFoto / 2 / SOBRESALIDA_MARCO_FOTO;

  // Zona de la foto en coordenadas locales de canvas (antes del offset de
  // centrado vertical) — crearTexturaCara la convierte a fracciones 0–1,
  // igual que zonaEnlace, y crearTarjetaFlotante la usa para ubicar la malla
  // 3D real. rx/ry son el semi-ancho/semi-alto de la FOTO (sin el marco) —
  // el marco se escala a partir de esos mismos valores en crearFotoEnmarcada.
  const zonaFoto = { cx: w / 2, cy: y + altoMarcoFoto / 2, rx: mitadAnchoFoto, ry: mitadAltoFoto };

  y += altoMarcoFoto;

  // Primera palabra en su propia línea, el resto en la siguiente (p. ej.
  // "Ludivina" / "Pérez Coronel") — no es un wrap por ancho como dividirLineas.
  const primerEspacio = config.nombre.indexOf(" ");
  const lineasNombre =
    primerEspacio === -1
      ? [config.nombre]
      : [config.nombre.slice(0, primerEspacio), config.nombre.slice(primerEspacio + 1)];

  // TAMANO_NOMBRE es el tamaño PREFERIDO (grande); si alguna línea no entra
  // en anchoTexto a ese tamaño, se achica lo mínimo necesario para que entre
  // — medido de verdad con measureText, no a ojo.
  const TAMANO_NOMBRE = 72;
  ctx.font = `bold ${TAMANO_NOMBRE * escala}px Georgia, serif`;
  const anchoMaximoLinea = Math.max(...lineasNombre.map((l) => ctx.measureText(l).width));
  const factorAjuste = Math.min(1, anchoTexto / anchoMaximoLinea);
  const tamanoNombreFinal = TAMANO_NOMBRE * factorAjuste;
  const alturaLineaNombre = tamanoNombreFinal * (48 / 46) * escala; // misma proporción alto-de-línea/tamaño que ya usaba el resto del archivo
  ctx.font = `bold ${tamanoNombreFinal * escala}px Georgia, serif`;

  // Con textBaseline="alphabetic", fillText dibuja hacia ARRIBA desde la Y
  // que recibe (el ascenso de la fuente) — con texto grande (54px, ~40px de
  // ascenso) un espacio fijo subestima cuánto sube el texto y lo mete dentro
  // del bloque anterior. Se mide el ascenso real para que el espacio visible
  // sea el que se pide, no "lo que sobre" después de restarlo.
  const ESPACIO_FOTO_NOMBRE = 27;
  const metricasNombre = ctx.measureText(lineasNombre[0]);
  const ascensoNombre = metricasNombre.actualBoundingBoxAscent || tamanoNombreFinal * escala * 0.78;
  const descensoNombre = metricasNombre.actualBoundingBoxDescent || tamanoNombreFinal * escala * 0.22;
  y += ESPACIO_FOTO_NOMBRE * escala + ascensoNombre;

  if (dibujar) {
    const gradiente = ctx.createLinearGradient(w * 0.15, 0, w * 0.85, 0);
    gradiente.addColorStop(0, ORO_OSCURO);
    gradiente.addColorStop(1, ORO_TEXTO);
    ctx.fillStyle = gradiente;
    lineasNombre.forEach((l, i) => ctx.fillText(l, w / 2, y + i * alturaLineaNombre));
  }
  y += (lineasNombre.length - 1) * alturaLineaNombre + descensoNombre + ESPACIO_MEDIO * escala;

  ctx.font = `italic ${36 * escala}px Georgia, serif`;
  if (dibujar) {
    ctx.fillStyle = ORO_OSCURO;
    ctx.fillText(`"${config.apodoCarinoso}"`, w / 2, y);
  }
  y += 36 * escala * 1.4 + ESPACIO_PEQUENO * escala; // apodo↔fechas: elementos directamente relacionados

  ctx.font = `${34 * escala}px Georgia, serif`;
  if (dibujar) {
    ctx.fillStyle = TINTA;
    ctx.fillText(`${config.nacimiento}  —  ${config.fallecimiento}`, w / 2, y);
  }
  y += 34 * escala * 1.5 + ESPACIO_GRANDE * escala;

  if (Array.isArray(config.mensajeFrontal)) {
    ctx.font = `${28 * escala}px Georgia, serif`;
    for (const linea of config.mensajeFrontal) {
      const lineasMsg = dividirLineas(ctx, linea, anchoTexto);
      if (dibujar) {
        ctx.fillStyle = TINTA;
        lineasMsg.forEach((l, i) => ctx.fillText(l, w / 2, y + i * 38 * escala));
      }
      y += lineasMsg.length * 38 * escala + ESPACIO_PEQUENO * escala;
    }
  }

  if (config.fraseDestacada) {
    y += (ESPACIO_MEDIO - ESPACIO_PEQUENO) * escala; // el párrafo anterior ya dejó ESPACIO_PEQUENO; esto lo completa a ESPACIO_MEDIO
    ctx.font = `bold ${31 * escala}px Georgia, serif`;
    const lineasDestacada = dividirLineas(ctx, config.fraseDestacada, anchoTexto * 0.94);
    if (dibujar) {
      ctx.fillStyle = ORO_OSCURO;
      lineasDestacada.forEach((l, i) => ctx.fillText(l, w / 2, y + i * 41 * escala));
    }
    y += lineasDestacada.length * 41 * escala + ESPACIO_MEDIO * escala;
  }

  if (config.fraseCierre) {
    ctx.font = `italic ${29 * escala}px Georgia, serif`;
    const lineasCierre = dividirLineas(ctx, config.fraseCierre, anchoTexto);
    if (dibujar) {
      ctx.fillStyle = TINTA;
      lineasCierre.forEach((l, i) => ctx.fillText(l, w / 2, y + i * 40 * escala));
    }
    y += lineasCierre.length * 40 * escala + ESPACIO_PEQUENO * escala;
  }

  if (config.lugar) {
    ctx.font = `${26 * escala}px Georgia, serif`;
    if (dibujar) {
      ctx.fillStyle = ORO_OSCURO;
      ctx.fillText(config.lugar, w / 2, y);
    }
    y += 26 * escala * 1.4;
  }

  return { ...dibujarEnlaceVoltear(ctx, w, y, escala, dibujar, "Ver dorso ›"), zonaFoto };
}

function diseñarDorso(ctx, w, config, escala, dibujar) {
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  const anchoTexto = w * 0.8;
  let y = 0;

  if (dibujar) dibujarFloron(ctx, w / 2, y, ORO, 29 * escala);
  y += 29 * escala * 1.5 + 35 * escala;

  ctx.font = `bold ${34 * escala}px Georgia, serif`;
  const lineasDed = dividirLineas(ctx, config.dedicatoria, anchoTexto);
  if (dibujar) {
    ctx.fillStyle = TINTA;
    lineasDed.forEach((l, i) => ctx.fillText(l, w / 2, y + i * 43 * escala));
  }
  y += lineasDed.length * 43 * escala + 41 * escala;

  ctx.font = `${28 * escala}px Georgia, serif`;
  for (const linea of config.mensaje) {
    const lineasMsg = dividirLineas(ctx, linea, anchoTexto);
    if (dibujar) {
      ctx.fillStyle = "#2a1d0c";
      lineasMsg.forEach((l, i) => ctx.fillText(l, w / 2, y + i * 38 * escala));
    }
    y += lineasMsg.length * 38 * escala + 21 * escala;
  }

  y += 14 * escala;
  if (dibujar) dibujarFloron(ctx, w / 2, y, ORO, 29 * escala);
  y += 29 * escala * 1.5 + 29 * escala;

  ctx.font = `bold ${32 * escala}px Georgia, serif`;
  if (dibujar) {
    ctx.fillStyle = ORO_OSCURO;
    ctx.fillText(config.firma, w / 2, y);
  }
  y += 32 * escala * 1.3;

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
  canvas.height = 1548; // mantiene la proporción 720/1548 = ancho/alto = 2/4.3, igual en ambas caras
  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;

  dibujarFondoTarjeta(ctx, w, h);

  const margenSuperior = h * margenSuperiorFrac;
  const areaUtil = h * areaUtilFrac;

  const { y: alturaBase } = diseñarFn(ctx, w, config, 1, false);
  const escala = Math.max(ESCALA_MINIMA_TEXTO, Math.min(1, areaUtil / alturaBase));
  const { y: alturaFinal, zonaEnlace: zonaLocal, zonaFoto: zonaFotoLocal } = diseñarFn(
    ctx,
    w,
    config,
    escala,
    false
  );

  const offsetSuperior = margenSuperior + Math.max(0, (areaUtil - alturaFinal) / 2);
  ctx.save();
  ctx.translate(0, offsetSuperior);
  diseñarFn(ctx, w, config, escala, true);
  ctx.restore();

  const textura = new THREE.CanvasTexture(canvas);
  textura.colorSpace = THREE.SRGBColorSpace;
  const zonaEnlace = zonaEnFracciones(zonaLocal, offsetSuperior, w, h);
  const zonaFoto = zonaFotoLocal
    ? {
        cx: zonaFotoLocal.cx / w,
        cy: (zonaFotoLocal.cy + offsetSuperior) / h,
        rx: zonaFotoLocal.rx / w,
        ry: zonaFotoLocal.ry / h,
      }
    : null;
  return { textura, zonaEnlace, zonaFoto };
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

// Forma de rectángulo redondeado centrada en el origen, de ancho/alto dados
// y radio de esquina r (se recorta solo si no entra).
function formaRectanguloRedondeado(ancho, alto, radio) {
  const x = -ancho / 2;
  const y = -alto / 2;
  const r = Math.min(radio, ancho / 2, alto / 2);
  const forma = new THREE.Shape();
  forma.moveTo(x + r, y);
  forma.lineTo(x + ancho - r, y);
  forma.quadraticCurveTo(x + ancho, y, x + ancho, y + r);
  forma.lineTo(x + ancho, y + alto - r);
  forma.quadraticCurveTo(x + ancho, y + alto, x + ancho - r, y + alto);
  forma.lineTo(x + r, y + alto);
  forma.quadraticCurveTo(x, y + alto, x, y + alto - r);
  forma.lineTo(x, y + r);
  forma.quadraticCurveTo(x, y, x + r, y);
  return forma;
}

// ShapeGeometry calcula los UV directamente de las coordenadas LOCALES de la
// forma, no de su bounding box — con formaRectanguloRedondeado (centrada en
// el origen) eso da UV negativos y la textura sale cortada a la mitad. Se
// recalculan a mano a partir de la caja real de la geometría, igual que
// mapearía un PlaneGeometry normal.
function geometriaRectanguloConTextura(ancho, alto, radio) {
  const geometria = new THREE.ShapeGeometry(formaRectanguloRedondeado(ancho, alto, radio));
  geometria.computeBoundingBox();
  const caja = geometria.boundingBox;
  const uv = geometria.attributes.uv;
  const pos = geometria.attributes.position;
  for (let i = 0; i < uv.count; i++) {
    uv.setXY(
      i,
      (pos.getX(i) - caja.min.x) / (caja.max.x - caja.min.x),
      (pos.getY(i) - caja.min.y) / (caja.max.y - caja.min.y)
    );
  }
  uv.needsUpdate = true;
  return geometria;
}

// Foto del frente, con marco: geometría unitaria (semi-ancho/semi-alto = 1),
// para que el llamador la escale al tamaño real en mundo con
// scale.set(rx, ry, 1) — nunca con setScalar, porque eso también encogería
// los desplazamientos de z que separan el marco de la foto, y volverían a
// pisarse (z-fighting).
function crearFotoEnmarcada(config) {
  const grupoFoto = new THREE.Group();

  const marco = new THREE.Mesh(
    new THREE.ShapeGeometry(
      formaRectanguloRedondeado(
        2 * SOBRESALIDA_MARCO_FOTO,
        2 * SOBRESALIDA_MARCO_FOTO,
        RADIO_ESQUINA_FOTO * SOBRESALIDA_MARCO_FOTO
      )
    ),
    new THREE.MeshBasicMaterial({ color: ORO_OSCURO })
  );
  marco.position.z = -0.001;
  grupoFoto.add(marco);

  // Arranca transparente (sin textura) y se revela cuando termina de cargar
  // la imagen — TextureLoader es asíncrono, pero el loop de render de
  // main.js ya corre cada frame, así que no hace falta esperar nada aquí.
  const foto = new THREE.Mesh(
    geometriaRectanguloConTextura(2, 2, RADIO_ESQUINA_FOTO),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 })
  );
  grupoFoto.add(foto);

  if (config.foto) {
    new THREE.TextureLoader().load(config.foto, (textura) => {
      textura.colorSpace = THREE.SRGBColorSpace;
      foto.material.map = textura;
      foto.material.opacity = 1;
      foto.material.needsUpdate = true;
    });
  }

  return grupoFoto;
}

// Devuelve un controlador para que el zoom de pellizco pueda superponerse a
// la distancia base sin pelear con el recálculo de resize/orientationchange:
// aplicar() siempre vuelve a multiplicar por el factorZoom vigente, nunca lo pisa.
function ajustarCamaraResponsiva(camera, ancho, alto, margen = 1.45) {
  let distanciaBase = margen;
  let factorZoom = 1;

  function aplicar() {
    const aspecto = window.innerWidth / window.innerHeight;
    const vFov = THREE.MathUtils.degToRad(camera.fov);
    const distanciaPorAlto = (alto * margen) / (2 * Math.tan(vFov / 2));
    const distanciaPorAncho = (ancho * margen) / (2 * Math.tan(vFov / 2) * aspecto);
    distanciaBase = Math.max(distanciaPorAlto, distanciaPorAncho);
    camera.position.z = distanciaBase * factorZoom;
  }
  aplicar();
  window.addEventListener("resize", aplicar);
  window.addEventListener("orientationchange", () => setTimeout(aplicar, 150));

  function establecerZoom(factor) {
    factorZoom = THREE.MathUtils.clamp(factor, ZOOM_MINIMO, ZOOM_MAXIMO);
    camera.position.z = distanciaBase * factorZoom;
  }

  return { establecerZoom, obtenerZoom: () => factorZoom };
}

export function crearTarjetaFlotante(scene, camera, config, onCambioVista) {
  const ancho = 2.0;
  const alto = 4.3; // si cambia, actualizar también el canvas.height de crearTexturaCara (misma proporción)
  const grosor = 0.08;
  const radioEsquina = 0.14;

  const camaraResponsiva = ajustarCamaraResponsiva(camera, ancho, alto, 1.2);
  // Límites del paneo de dos dedos, en unidades de mundo — evita que al
  // deslizar se pierda la tarjeta de vista por completo.
  const LIMITE_PAN_X = ancho * 0.9;
  const LIMITE_PAN_Y = alto * 0.75;

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
  const { textura: texturaFrente, zonaEnlace: zonaEnlaceFrente, zonaFoto } = crearTexturaCara(
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

  // La foto es una malla 3D aparte, hija del mismo grupo que frente/dorso —
  // así hereda rotación/flote/perspectiva automáticamente (igual que ellos),
  // y se ubica con la zona que diseñarFrente ya reservó para la foto.
  if (zonaFoto && config.foto) {
    const fotoEnmarcada = crearFotoEnmarcada(config);
    const anchoMundoFrente = ancho * 0.94;
    // Escala no uniforme (rx≠ry): crearFotoEnmarcada arma la forma con
    // semi-ancho/semi-alto 1, y esto la ajusta al rectángulo real.
    const radioMundoX = zonaFoto.rx * anchoMundoFrente;
    const radioMundoY = zonaFoto.ry * altoTextoFrente;
    const xMundo = (zonaFoto.cx - 0.5) * anchoMundoFrente;
    const yMundo = (0.5 - zonaFoto.cy) * altoTextoFrente;
    fotoEnmarcada.scale.set(radioMundoX, radioMundoY, 1);
    fotoEnmarcada.position.set(xMundo, yMundo, grosor / 2 + 0.004);
    grupo.add(fotoEnmarcada);
  }

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

  // Un tap (sin arrastre) lanza un rayo contra frente/dorso; si cae dentro
  // de zonaEnlaceFrente/zonaEnlaceDorso (ver dibujarEnlaceVoltear), activa
  // alternarVista().
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

  // --- Zoom y paneo de pellizco (dos dedos), convive con el arrastre de un dedo ---
  // punterosActivos trackea cada dedo por su pointerId; con 2 activos se usan
  // la distancia entre ellos (zoom) y su punto medio (paneo) contra el
  // inicio del gesto — nunca contra "1" o el centro fijos, para que un
  // segundo pellizco siga desde donde quedó el anterior en vez de saltar.
  const punterosActivos = new Map();
  let distanciaPellizcoInicial = null;
  let zoomInicialPellizco = 1;
  let puntoMedioInicial = { x: 0, y: 0 };
  let panoInicial = { x: 0, y: 0 };

  function distanciaEntrePunteros() {
    const puntos = [...punterosActivos.values()];
    return Math.hypot(puntos[0].x - puntos[1].x, puntos[0].y - puntos[1].y);
  }
  function puntoMedioPunteros() {
    const puntos = [...punterosActivos.values()];
    return { x: (puntos[0].x + puntos[1].x) / 2, y: (puntos[0].y + puntos[1].y) / 2 };
  }

  function alPresionar(e) {
    punterosActivos.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (punterosActivos.size === 2) {
      distanciaPellizcoInicial = distanciaEntrePunteros();
      zoomInicialPellizco = camaraResponsiva.obtenerZoom();
      puntoMedioInicial = puntoMedioPunteros();
      panoInicial = { x: camera.position.x, y: camera.position.y };
      // Un pellizco nunca debe interpretarse como tap ni como arrastre de giro.
      arrastrando = false;
      distanciaMaxima = Infinity;
      return;
    }
    if (punterosActivos.size === 1) {
      arrastrando = true;
      inicio.x = e.clientX;
      inicio.y = e.clientY;
      inicioTiempo = performance.now();
      distanciaMaxima = 0;
    }
  }
  function alMover(e) {
    if (!punterosActivos.has(e.pointerId)) return;
    punterosActivos.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (punterosActivos.size === 2 && distanciaPellizcoInicial) {
      const distanciaActual = distanciaEntrePunteros();
      camaraResponsiva.establecerZoom(zoomInicialPellizco * (distanciaPellizcoInicial / distanciaActual));

      // El punto medio de los dos dedos arrastra la cámara en el plano de
      // la tarjeta (z=0), convertido de píxeles de pantalla a unidades de
      // mundo con lo que la cámara ve a esa profundidad — así el contenido
      // "sigue" al dedo sin importar el nivel de zoom actual.
      const puntoMedioActual = puntoMedioPunteros();
      const dxPantalla = puntoMedioActual.x - puntoMedioInicial.x;
      const dyPantalla = puntoMedioActual.y - puntoMedioInicial.y;
      const { anchoVisible, altoVisible } = tamanoVisibleEnProfundidad(camera, 0);
      camera.position.x = THREE.MathUtils.clamp(
        panoInicial.x - (dxPantalla / window.innerWidth) * anchoVisible,
        -LIMITE_PAN_X,
        LIMITE_PAN_X
      );
      camera.position.y = THREE.MathUtils.clamp(
        panoInicial.y + (dyPantalla / window.innerHeight) * altoVisible,
        -LIMITE_PAN_Y,
        LIMITE_PAN_Y
      );
      return;
    }

    if (!arrastrando) return;
    const dx = e.clientX - inicio.x;
    const dy = e.clientY - inicio.y;
    distanciaMaxima = Math.max(distanciaMaxima, Math.hypot(dx, dy));
    arrastre.y = THREE.MathUtils.clamp(dx * 0.008, -1.1, 1.1);
    arrastre.x = THREE.MathUtils.clamp(-dy * 0.006, -0.55, 0.55);
  }
  function alSoltar(e) {
    punterosActivos.delete(e.pointerId);
    if (punterosActivos.size < 2) distanciaPellizcoInicial = null;
    if (punterosActivos.size > 0) return;

    arrastrando = false;
    // Tap = movimiento mínimo y suelta rápida; si no, fue un arrastre para
    // girar la tarjeta y no debe activar el enlace.
    if (distanciaMaxima < 6 && performance.now() - inicioTiempo < 300) {
      manejarTap(e);
    }
  }
  function alCancelar(e) {
    punterosActivos.delete(e.pointerId);
    if (punterosActivos.size < 2) distanciaPellizcoInicial = null;
    if (punterosActivos.size === 0) arrastrando = false;
  }

  window.addEventListener("pointerdown", alPresionar);
  window.addEventListener("pointermove", alMover);
  window.addEventListener("pointerup", alSoltar);
  window.addEventListener("pointercancel", alCancelar);

  // Fracción del camino que queda por recorrer tras 1 segundo — usado como
  // 1 - K^delta (no un lerp de factor fijo), para que la velocidad no
  // dependa del frame rate del dispositivo. Valores más chicos = llega más
  // rápido al objetivo.
  const SUAVIZADO_GIRO = 0.02;
  const SUAVIZADO_FLOTE = 0.07;
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
  }

  return { grupo, tarjeta, actualizar, alternarVista };
}
