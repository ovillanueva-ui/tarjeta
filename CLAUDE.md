# Tarjeta memorial — estado del proyecto

Última actualización: 2026-11-10 (sesión de ajustes de espaciado y texto, rama `textos-mejorados` fusionada a `main`). Este archivo describe el estado **actual** del proyecto, no su historial — para historial de decisiones usar `git log`.

## Qué es esto

Tarjeta memorial 3D para **Ludivina Pérez Coronel ("Ludy")**. El contenido de `js/config.js` es el real (no es un ejemplo). `PLAN.md` es **referencia histórica, no especificación vigente** — describe un concepto de libro con bisagra, vela, partículas y galería que fue descartado; lo vigente es lo implementado en `js/scene.js` y lo que dice este archivo.

El diseño actual es un **contenedor flotante** (caja 3D con esquinas redondeadas, `RoundedBoxGeometry`), no un libro que se abre — las caras frontal/dorso son planos (`PlaneGeometry`, esquinas cuadradas) pegados encima del cuerpo redondeado; se probó redondear también esos planos (`geometriaRectanguloConTextura`, la misma que ya usa el marco de la foto) y se revirtió a pedido del usuario, queda como posible pendiente si se retoma. El contenido se lee girando la tarjeta (arrastre) o con el enlace "Ver dorso ›" / "‹ Ver frente" dibujado dentro de la propia textura — cara frontal con foto/nombre/fechas/mensaje narrativo/lugar (**ya no hay apodo "Ludy" como campo propio**, se quitó de `config.js`, de `#contenido-accesible` y de la textura; las fechas ocupan ahora el lugar donde estaba), cara dorso con una oración ("Señor, fortalece nuestro corazón" ... "Amén."). No hay vela, galería de fotos ni partículas.

Repo en GitHub: `github.com/ovillanueva-ui/tarjeta`, rama `main` (única rama; todo el trabajo vive ahí, ya sincronizada con `origin/main`). Vercel: `vercel.json` está en el repo pero no se ha verificado si existe un despliegue activo.

Se instaló localmente la skill `ui-ux-pro-max` (de `github.com/nextlevelbuilder/ui-ux-pro-max-skill`) en `.claude/skills/ui-ux-pro-max/` — motor de búsqueda Python sobre reglas de UI/UX/accesibilidad, sin red. Se corre con `py -3 .claude/skills/ui-ux-pro-max/scripts/search.py "<query>" --domain <dominio>` (el launcher `py` está disponible; `python`/`python3` sueltos no están en el PATH en esa máquina).

## Stack

HTML + ES modules + Three.js v0.160.0, sin build ni `npm install`. Three.js vendorizado en `js/vendor/three/`. Tipografía: **Nunito** (Google Fonts, vía `<link>` en `index.html`), reemplazó a Georgia en todas las texturas.

## Estado actual de cada archivo

- **`index.html`** — `<canvas>` a pantalla completa, `<div id="contenido-accesible">` (ver accesibilidad), `<button id="boton-girar">` (respaldo de teclado), import map a `js/vendor/three/`, y el `<link>` de Google Fonts para Nunito (pesos regular/bold, normal/itálica).
- **`css/styles.css`** — fondo de página `#FAF7F0`, clase `.sr-only`, estilo de `#boton-girar` como *skip link* (oculto hasta foco de teclado, fuente Nunito).
- **`js/config.js`** — único archivo de contenido: `nombre`, `nacimiento` (`"02-11-1966"`), `fallecimiento`, `mensajeFrontal` (array), `fraseDestacada`, `fraseCierre`, `lugar`, `foto`/`fotoAlt` para el frente; `dedicatoria` (título "Señor, fortalece nuestro corazón"), `mensaje` (array, 4 párrafos — el primero ya no empieza con "Señor,", arranca en "Enséñanos..."), `firma` ("Amén.") para el dorso. **No existe campo `apodoCarinoso`** — se quitó junto con todo su uso (antes vivía entre nombre y fechas en el frente, y duplicado en `#contenido-accesible`); si se reintroduce "Ludy" como campo, falta decidir dónde se dibuja de nuevo.
- **`js/main.js`** — arranque: detecta WebGL, carga las variantes de Nunito con `document.fonts.load()` antes de construir la tarjeta (si no, el primer dibujo del canvas cae al tipo de letra del sistema), llena `#contenido-accesible` desde `config.js`, inicializa escena, crea la tarjeta, conecta `#boton-girar` a `tarjeta.alternarVista()`, corre el loop de render. Sin WebGL: quita canvas y botón, muestra `#contenido-accesible` visible.
- **`js/scene.js`** — toda la lógica 3D:
  - `inicializarEscena`: escena/cámara/luces/renderer. Fondo de escena `0xfaf7f0`.
  - `ajustarCamaraResponsiva`: calcula distancia de cámara según aspecto de pantalla (margen `1.2`), recalcula en `resize`/`orientationchange`. Devuelve `{ establecerZoom, obtenerZoom }` — el zoom de pellizco es un factor *sobre* esa distancia base, nunca la reemplaza.
  - `crearTarjetaFlotante`: geometría `ancho=2.0`, `alto=4.3`. Contiene texturas de frente/dorso, sombra, arrastre con resorte al soltar, flote vertical, zoom+paneo de pellizco, raycasting del enlace voltear.
  - **Zoom y paneo de pellizco**: `punterosActivos` (`Map` por `pointerId`) distingue 1 dedo (giro) de 2 dedos (pellizco). La distancia entre dedos controla zoom (`ZOOM_MINIMO=0.55`/`ZOOM_MAXIMO=1.5` sobre el zoom vigente), el punto medio controla paneo (límites `LIMITE_PAN_X`/`LIMITE_PAN_Y`). Listeners de `pointerup` y `pointercancel`.
  - `diseñarFrente` / `diseñarDorso` + `crearTexturaCara`: dibujan el texto en canvas 2D (720×1548) con ajuste automático de escala — miden el espacio necesario antes de dibujar y, si no entra, reducen la fuente hasta `ESCALA_MINIMA_TEXTO = 0.6`. No hardcodear tamaños sin ese paso de medición.
  - **Espaciado vertical**: 3 constantes compartidas `ESPACIO_PEQUENO=21`/`ESPACIO_MEDIO=33`/`ESPACIO_GRANDE=38`, usadas en ambas caras (el dorso se unificó a estas — antes tenía sus propios números sueltos). Dos huecos del frente tienen su propio valor puntual, no ligado a esas constantes, a pedido explícito del usuario tras iterar en vivo: el hueco "En memoria de"→foto (`8`, con la altura de línea del encabezado en `1.0`, ver comentario en el código sobre por qué es seguro ahí) y el hueco fechas→`mensajeFrontal` (`GAP_FECHAS_MENSAJE=105`). El bloque nombre→fechas usa `HUECO_IDENTIDAD=40`, calculado midiendo el ascenso/descenso real de ambos textos (no con la aproximación `fontSize×factor` que usa el resto) — ver comentario en el código, ahí se explica por qué la aproximación daba un espacio inconsistente.
  - Fechas (frente): ahora en `bold`, `24px`, en el lugar donde antes estaba el apodo "Ludy" (ya no existe ese campo).
  - Firma del dorso ("Amén."): `42px` (antes `32px`), sigue en `bold`/`ORO_OSCURO`.
  - **Cursiva+negrita por palabra en la oración del dorso**: `PALABRAS_CLAVE_ORACION` (Set fijo de palabras, selección editorial) + `limpiarPalabra` + `dividirLineasConEnfasis` + `dibujarLineaConEnfasis` — canvas 2D no soporta estilos mixtos en un solo `fillText`, así que estas funciones envuelven línea por línea midiendo cada palabra con su propia fuente (regular o `italic bold`) y dibujan token por token con `ctx.textAlign="left"` calculando el centrado a mano. Si se agregan palabras nuevas a `config.mensaje`, ninguna se marca sola — hay que añadirlas a `PALABRAS_CLAVE_ORACION` a mano.
  - `dibujarEnlaceVoltear`: dibuja "Ver dorso ›"/"‹ Ver frente" dentro de la propia textura (no overlay de HTML — ver accesibilidad), con zona clicable detectada por `THREE.Raycaster` en `pointerup` (solo si fue tap: <6px, <300ms).
  - **Paleta de colores actual** (todas como constantes al inicio del archivo):
    - `ORO = "#142d4e"` — decorativo: florón ✦ (dorso) y puntos de esquina del marco.
    - `ORO_OSCURO = "#c6a15b"` y `ORO_TEXTO = "#c6a15b"` — texto: "En memoria de", frase destacada, lugar, firma, degradado del nombre, enlace voltear. Contraste contra el fondo de la tarjeta ≈ 2.27:1 — **por debajo del mínimo AA (4.5:1), aceptado explícitamente por el usuario**, no "corregirlo" sin que lo pida.
    - `TINTA = "#465365"` — texto no dorado: fechas, mensaje narrativo del frente, frase de cierre, dedicatoria y oración del dorso.
    - `MARCO = "#e5c98e"` — marco de la foto (malla 3D). La línea del marco decorativo (`dibujarMarcoDorado`) es un valor aparte, actualmente `rgba(20,45,78,0.8)` (mismo tono que `ORO`) — no está ligada a la constante `MARCO` pese al nombre, son dos cosas distintas en el código.
    - Lienzo de la tarjeta (`dibujarFondoTarjeta`) y fondo de página (`scene.background` + CSS `body`): `#FAF7F0`.
    - Canto/grosor del cuerpo 3D de la tarjeta (`MeshStandardMaterial` de la malla `tarjeta`, visible en los bordes del box): `0x7086a3`, `roughness: 0.85`, `metalness: 0`.
  - No hay florón (✦) en el frente (se quitó para liberar espacio vertical); el dorso conserva los suyos (dos).
  - No hay ningún efecto de fondo (cielo, partículas, ramas) — se probaron y descartaron explícitamente por el usuario; no reintroducir sin pedido nuevo y dirección visual específica.
- **`js/vendor/three/`** — Three.js v0.160.0 + `RoundedBoxGeometry.js` vendorizados, no tocar.

## Accesibilidad e interacción "ver dorso/frente"

El texto de la tarjeta solo existe como píxeles en texturas WebGL — invisible para lectores de pantalla. Resuelto así:

- `#contenido-accesible` (poblado en `main.js` desde `config.js`): duplica todo el contenido como HTML semántico (`h1`, `p`, `blockquote`), oculto con `.sr-only` mientras la escena 3D funcione.
- El control visual para voltear la tarjeta **no es un `<button>` de HTML superpuesto** — un overlay de DOM no comparte rotación/perspectiva/iluminación con el objeto 3D y se ve "pegado encima". El enlace vive **dentro de la propia textura** (`dibujarEnlaceVoltear`) con raycasting para el clic.
- `#boton-girar` (HTML) es solo respaldo de teclado/lector de pantalla — oculto como *skip link*, visible solo con foco de Tab. Dispara `tarjeta.alternarVista()`.

## Guardrails para cambios futuros

- No anidar un efecto decorativo de fondo como hijo del grupo que rota/flota — debe vivir en su propio grupo agregado directo a la escena.
- No dimensionar un fondo/ambiente en unidades relativas al objeto principal — calcular según lo que la cámara ve a esa profundidad (`tamanoVisibleEnProfundidad`).
- No dibujar texto en una textura a tamaño fijo sin medir primero (ver sistema de autoescala arriba). Si el contenido real no entra ni al piso de escala, agrandar `alto` físico de la tarjeta y `canvas.height` de las texturas en la misma proporción, no seguir bajando el piso.
- Un elemento HTML no se ve "integrado" sobre una escena WebGL que rota — si algo debe sentirse parte de un objeto 3D, dibujarlo dentro de su textura.
- El usuario prefiere iterar un cambio visual a la vez, confirmado en vivo (navegador o dispositivo real) antes de seguir con el próximo.
- Para depurar posición/apariencia sin navegador en la sesión de CLI: headless Chrome con `--use-gl=angle --use-angle=swiftshader --enable-webgl --ignore-gpu-blocklist` (nunca `--disable-gpu`) sirve para capturas rápidas, pero no reemplaza probar en el dispositivo real. El usuario pidió explícitamente no usar la herramienta de Artifact ni mostrarle resultados solo por imagen — los cambios se verifican en su propio dispositivo (servidor en LAN) o se señalan con anotaciones directamente en el código.

## Pendiente / sin resolver

- **Reflejo metálico al girar la tarjeta**: reportado en una sesión anterior, nunca reconfirmado tras los cambios de paleta más recientes. Si vuelve a aparecer, pedir ángulo/momento concreto antes de tocar materiales.
- No se ha decidido si se agregarán fotos adicionales, música, u otra pieza del `PLAN.md` original — no asumir, confirmar con el usuario.
- No se ha confirmado si existe un despliegue activo en Vercel.
- Opcional, no implementado: cursor `pointer` al pasar sobre la zona del enlace "ver dorso/frente" (raycasting también en `pointermove`).
- El paneo de pellizco no se ha validado con un gesto real en dispositivo (el zoom sí, en iPhone).

## Cómo correr esto en local

Necesita un servidor local (módulos ES, no abrir `index.html` por doble clic):

```
python3 -m http.server 5500
```

Sirve en `http://localhost:5500`. Para probar en otro dispositivo en la misma red Wi-Fi: averiguar la IP LAN de la máquina (en macOS, `ipconfig getifaddr en0`) y abrir `http://<esa-ip>:5500/` desde el otro dispositivo — el servidor de `http.server` ya escucha en todas las interfaces por defecto, no hace falta flag adicional.
