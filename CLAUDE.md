# Tarjeta memorial — estado del proyecto

Última actualización: 2026-11-09. Este archivo resume dónde quedó el trabajo para retomarlo sin repetir decisiones ya tomadas.

## Qué es esto

Tarjeta memorial 3D para **Ludivina Pérez Coronel ("Ludy")**, construida a partir de `PLAN.md` pero con un enfoque visual distinto al que describe ese plan (ver "Decisiones que ya cambiaron" abajo). El contenido de `js/config.js` ya es el real (no es un ejemplo inventado). Se validó el diseño de forma incremental, en vivo, en el navegador.

El proyecto **ya tiene repo git y vive en GitHub**: `github.com/ovillanueva-ui/tarjeta` (rama `main`). La Fase 7 del `PLAN.md` original (publicación) está parcialmente cumplida: GitHub, sí; Vercel, sin confirmar — no se ha verificado si ya existe un despliegue activo.

Se instaló localmente la skill `ui-ux-pro-max` (de `github.com/nextlevelbuilder/ui-ux-pro-max-skill`) en `.claude/skills/ui-ux-pro-max/` — motor de búsqueda Python sobre reglas de UI/UX/accesibilidad, sin red. Se corre con `py -3 .claude/skills/ui-ux-pro-max/scripts/search.py "<query>" --domain <dominio>` (el launcher `py` está disponible; `python`/`python3` sueltos no están en el PATH).

## Stack

HTML + ES modules + Three.js v0.160.0, sin build ni `npm install`. Three.js está vendorizado en `js/vendor/three/` (descargado una vez de unpkg). Se evaluó explícitamente usar Next.js/React y se descartó: el 3D lo hace Three.js/WebGL en cualquier caso, Next.js solo añadiría un paso de compilación innecesario para una sola página estática sin backend.

## Decisiones que YA cambiaron respecto a `PLAN.md`

`PLAN.md` describe una tarjeta que se abre como libro (bisagra), con vela, partículas de pétalos/mariposas, galería y audio. **Todo eso se descartó.** El usuario rechazó el concepto de "mini-libro" explícitamente. El diseño actual es:

- Un **contenedor flotante** (caja 3D con esquinas redondeadas, `RoundedBoxGeometry`), no un libro que se abre.
- El contenido se lee **girando la tarjeta** con el mismo arrastre que ya existía — cara frontal con nombre/apodo/fechas/mensaje narrativo/lugar, cara dorso con una oración ("Señor, fortalece nuestro corazón" ... "Amén.").
- Hay un **enlace "Ver dorso ›" / "‹ Ver frente"** para voltear sin tener que arrastrar — ver sección de accesibilidad/interacción abajo.
- No hay vela, no hay galería de fotos, no hay partículas de pétalos/mariposas. Esas fases del `PLAN.md` quedaron obsoletas; no asumir que se van a construir sin confirmarlo de nuevo con el usuario.

Si se retoma trabajo en este proyecto, **tratar `PLAN.md` como referencia histórica, no como especificación vigente** — lo vigente es lo que hay implementado en `js/scene.js` y lo que dice este archivo.

## Estado actual de cada pieza (archivo por archivo)

- `index.html` — `<canvas>` a pantalla completa, un `<div id="contenido-accesible">` (ver accesibilidad) y un `<button id="boton-girar">` (respaldo de teclado, ver abajo), import map apuntando a `js/vendor/three/`.
- `css/styles.css` — fondo de página en `#f7f3e7` (variante clara del Pantone 11-0106 TCX "Sweet Corn", aprox. `#F0EBD7`), clase `.sr-only` (oculta visualmente, visible a lectores de pantalla), y el estilo de `#boton-girar` como *skip link* (oculto hasta recibir foco de teclado).
- `js/config.js` — único archivo de contenido, **ya con los datos reales de Ludivina**: `nombre`, `apodoCarinoso`, `nacimiento`, `fallecimiento`, `mensajeFrontal` (array, párrafos del frente), `fraseDestacada`, `fraseCierre`, `lugar` para el frente; `dedicatoria` (ahora el título en negrita "Señor, fortalece nuestro corazón"), `mensaje` (array, los 4 párrafos de la oración), `firma` ("Amén.") para el dorso.
- `js/scene.js` — toda la lógica 3D. Contiene:
  - `inicializarEscena`: escena/cámara/luces/renderer.
  - `ajustarCamaraResponsiva`: calcula la distancia de cámara según el aspecto real de pantalla para que la tarjeta siempre quepa con margen (recalcula en `resize` y `orientationchange`). Margen actual: `1.2`. Devuelve un controlador `{ establecerZoom, obtenerZoom }` — el zoom de pellizco se aplica como un factor *sobre* esa distancia base, nunca la reemplaza, así resize/orientationchange no pisan el zoom vigente del usuario.
  - `crearTarjetaFlotante`: el contenedor aislado — geometría (`ancho=2.0`, `alto=4.3`; empezó en `2.8`, subió a `3.2` porque el contenido real del frente no cabía, y subió otra vez en dos rondas a `3.8` y luego `4.3` para poder agrandar el texto sin que el autoajuste lo volviera a encoger — ver lección 8), texturas de frente/dorso, sombra, arrastre con resorte al soltar, flote vertical suave, zoom+paneo de pellizco (ver abajo), y el raycasting del enlace "ver dorso/frente" (ver abajo).
  - **Zoom y paneo de pellizco** (dentro de `crearTarjetaFlotante`): `punterosActivos` (un `Map` por `pointerId`) distingue 1 dedo (arrastre de giro, comportamiento de siempre) de 2 dedos (pellizco). Con 2 dedos, la *distancia* entre ellos controla el zoom (factor sobre el zoom vigente vía `camaraResponsiva.establecerZoom`, con límites `ZOOM_MINIMO=0.55`/`ZOOM_MAXIMO=1.5`) y su *punto medio* controla el paneo (mueve `camera.position.x/y`, convertido de píxeles a unidades de mundo con `tamanoVisibleEnProfundidad(camera, 0)`, con límites `LIMITE_PAN_X`/`LIMITE_PAN_Y` para no perder la tarjeta de vista). Un pellizco nunca se interpreta como tap (se fuerza `distanciaMaxima = Infinity` al detectar el segundo dedo). Hay listener de `pointercancel` además de `pointerup` para no dejar el estado de gesto colgado si el sistema operativo cancela el touch.
  - `diseñarFrente` / `diseñarDorso` + `crearTexturaCara`: dibujan el texto en un canvas 2D (720×1548, misma proporción que `ancho`/`alto`) con un **sistema de ajuste automático de escala** — miden cuánto espacio necesita el texto antes de dibujar, y si no cabe, reducen la fuente proporcionalmente hasta un piso de `ESCALA_MINIMA_TEXTO = 0.6` (nunca más chico que eso; mejor que se recorte un poco a que sea ilegible). No volver a hardcodear tamaños sin ese paso de medición. El frente ya no tiene florón (✦) decorativo — se quitó para liberar espacio vertical; el dorso sí conserva los suyos.
  - `dibujarEnlaceVoltear`: dibuja el enlace "Ver dorso ›" / "‹ Ver frente" **dentro de la propia textura**, al final del frente y del dorso respectivamente, con subrayado trazado a mano. Devuelve la caja clicable en fracciones 0–1 del canvas (`zonaEnlace`), que `crearTarjetaFlotante` usa con un `THREE.Raycaster` en `pointerup` (solo si fue un *tap* — movimiento <6px y <300ms — para no confundirlo con un arrastre de giro) para activar `alternarVista()`.
  - Colores de texto ajustados para contraste AA (4.5:1) sobre el fondo de tarjeta `#f0ebd7`: `ORO_OSCURO = "#84661e"` (antes `#8a6a1f`, 4.22:1) y `ORO_TEXTO = "#806719"` (variante de `ORO` para texto real). `ORO` original (`#c9a227`) se dejó intacto pero **solo para elementos decorativos** (florón ✦, marco) — no usarlo en texto, falla contraste.
  - El fondo de cielo/nubes (`crearBrumaCeleste`, antes "aura celestial") se quitó por decisión explícita del usuario al simplificar el fondo para mejorar la distribución móvil.
  - No hay ningún efecto de fondo actualmente. Se probó un segundo intento tras la bruma — `crearRamasDoradas` ("efecto libro mágico": ramas doradas tenues con nodos que se iluminaban al azar) — y el usuario lo descartó también ("el efecto no es el deseado"), así que se quitó por completo. No reintroducir sin que el usuario lo pida de nuevo con una dirección visual más específica. La lección de contraste de color que dejó (ver lección 9) sigue aplicando a cualquier efecto de brillo futuro, aunque el código que la originó ya no exista.
- `js/main.js` — arranque: detecta WebGL, llena `#contenido-accesible` desde `config.js`, inicializa escena, crea la tarjeta, conecta el clic de `#boton-girar` a `tarjeta.alternarVista()`, corre el loop de render. Si no hay WebGL: quita el canvas y el botón, y muestra `#contenido-accesible` visible (ya trae todo el contenido del frente y del dorso de corrido).
- `js/vendor/three/` — Three.js v0.160.0 + `RoundedBoxGeometry.js` vendorizados (no tocar, son librería externa).

## Accesibilidad e interacción "ver dorso/frente" (decisión importante, no deshacer sin razón)

El texto de la tarjeta solo existe como píxeles dentro de texturas WebGL — invisible para lectores de pantalla, no indexable, no seleccionable. Se resolvió así:

- `#contenido-accesible` (en `index.html`, poblado en `main.js` desde `config.js`): duplica todo el contenido como HTML real semántico (`h1`, `p`, `blockquote`), oculto visualmente con `.sr-only` mientras la escena 3D funcione.
- El control visual para voltear la tarjeta **no es un `<button>` de HTML superpuesto** — se intentó así primero y se descartó: un elemento DOM posicionado sobre el canvas, aunque se le siga la posición del flote, nunca comparte la rotación/perspectiva/iluminación del objeto 3D y se ve "pegado encima" en vez de parte de la tarjeta (ver lección 6 abajo). La solución final fue dibujar el enlace **dentro de la propia textura** (`dibujarEnlaceVoltear`) y detectarlo con raycasting — hereda automáticamente rotación, flote y escorzo, y se "oculta" solo cuando esa cara no mira a cámara (comportamiento por defecto de `MeshBasicMaterial` con `side: FrontSide`).
- `#boton-girar` (HTML) se mantuvo, pero reducido a **respaldo de teclado/lector de pantalla** únicamente — oculto como *skip link*, solo visible al recibir foco con Tab. Dispara el mismo `tarjeta.alternarVista()`.

## Lecciones ya aprendidas (no repetir los mismos errores)

1. **Nunca anidar un efecto decorativo (halo, cielo, partículas) como hijo del grupo que rota/flota.** Aplicó mientras existió la bruma (ver abajo, ya quitada): vivía en su propio grupo, añadido directo a la escena, y solo copiaba la posición Y (el flote) del contenedor cada frame — nunca su rotación. Sigue aplicando si se agrega cualquier efecto de fondo nuevo.
2. **Nunca dimensionar un fondo/ambiente en unidades relativas al objeto principal.** Los fondos deben calcularse según lo que la cámara efectivamente ve a esa profundidad (`tamanoVisibleEnProfundidad`, que sigue en el código — ahora la usa el paneo de pellizco, no la bruma).
3. **Nunca dibujar texto en un canvas de textura a tamaño fijo sin medir primero**, y **el piso de escala mínima no es gratis**: si el contenido real es más largo que el de prueba, puede llegar al piso (`ESCALA_MINIMA_TEXTO`) y aun así desbordar el área reservada hacia el marco decorativo. La solución no es bajar más el piso (perjudica legibilidad) sino agrandar el `alto` físico de la tarjeta (y el `canvas.height` de las texturas, misma proporción) para dar más margen real. Esto ya pasó una vez con el contenido real de Ludivina.
4. El usuario prefiere iterar **un cambio visual a la vez**, confirmado en vivo en el navegador antes de seguir — no construir varias piezas nuevas de golpe.
5. Reflejo/brillo metálico raro al girar la tarjeta: se mitigó bajando `metalness` a 0 y suavizando las luces, pero el usuario reportó que el efecto **seguía presente** incluso después de aislar la bruma del grupo rotante. La bruma ya se quitó por completo (no solo aislada) — **sigue sin confirmarse si el reflejo desapareció con ella o si la causa era otra** (ver "Pendiente" abajo).
6. **Un elemento de HTML posicionado "encima" de una escena WebGL (aunque se calcule bien su posición en pantalla) se ve pegado/sobrepuesto, no integrado**, porque no comparte rotación, escorzo de perspectiva ni iluminación con los objetos 3D. Si algo necesita sentirse "parte de" un objeto 3D que rota/flota, dibujarlo dentro de la textura del objeto (con raycasting para el clic) en vez de perseguirlo con un overlay de DOM. Validado con el enlace "Ver dorso/Ver frente" — varias iteraciones de reposicionar el botón de HTML no lo arreglaron; moverlo a la textura sí.
7. Al depurar posición en pantalla y no tener navegador en la sesión de CLI: pedir una captura (o una descripción de hacia dónde está desviado) en vez de seguir ajustando matemática a ciegas — ahorra rondas de ida y vuelta. Un headless Chrome local con `--use-gl=angle --use-angle=swiftshader --enable-webgl --ignore-gpu-blocklist` (nunca `--disable-gpu`, eso apaga WebGL y cae al respaldo 2D) sirve para capturas rápidas a un tamaño de viewport exacto, pero no reemplaza probar en el dispositivo real — el motor (Chrome/swiftshader vs. Safari/WebKit real) y las fuentes disponibles difieren.
8. **Para agrandar el texto de verdad (no solo evitar que se encoja) sin pelear con el autoajuste de escala**: subir los tamaños de fuente Y el `alto` físico de la tarjeta (y el `canvas.height` de las texturas, misma proporción) por el mismo factor a la vez — así `alturaBase` y `areaUtil` crecen juntos y la escala resultante no cambia, pero el tamaño real en pantalla sí sube, **siempre que el ancho de pantalla siga siendo la restricción dominante de la cámara** (pantallas angostas tipo celular; en escritorio, donde domina el alto, el crecimiento se cancela matemáticamente y no se nota — no es un bug, es broma de qué dimensión manda en `ajustarCamaraResponsiva`). Subir solo la fuente sin subir `alto` hace que el autoajuste la vuelva a encoger para que quepa.
9. **Un efecto de brillo/glow puede estar dibujándose perfectamente y aun así ser invisible — por falta de contraste de color contra el fondo, no por un bug.** Pasó con un efecto de fondo de ramas doradas que se probó y luego se descartó (ver "Trabajo en curso" abajo): el tono de pico era casi blanco (`255,244,214`) y el fondo de página también es un crema pálido (`#f7f3e7`) — casi el mismo color, así que el "brillo" se perdía sin importar opacidad o tamaño. Antes de sospechar de la lógica de tiempo/estado, forzar el valor a un color de alto contraste obvio (rojo, azul) de forma temporal para descartar primero que el problema sea de renderizado — si con un color chillón sí se ve, el bug (si lo hay) está en la paleta de color elegida, no en el cálculo. Esta lección sigue aplicando a cualquier efecto de brillo futuro aunque ese código ya no exista.

## Pendiente / sin resolver

- **Reflejo metálico al girar la tarjeta**: el usuario confirmó que persistía ("el efecto prevalece") incluso con la bruma/aura ya aislada de la rotación. Ahora la bruma se quitó por completo del proyecto (ver rama `mejoras-moviles`) — falta confirmar con el usuario si el reflejo desapareció con ella o si la causa era otra (p. ej. `MeshStandardMaterial` + luces direccionales duras sobre la geometría redondeada). Pedir ejemplos concretos (ángulo/momento) si sigue presente.
- No se ha decidido si se agregarán fotos adicionales, música, o cualquier otra pieza del `PLAN.md` original — no asumir, confirmar con el usuario.
- No se ha confirmado si ya existe un despliegue en Vercel; `vercel.json` está en el repo pero falta verificar el estado real del hosting.
- Opcional, no confirmado: cambiar el cursor a `pointer` al pasar sobre la zona del enlace "ver dorso/frente" (raycasting también en `pointermove`) — quedó explícitamente como mejora de fase 2, no implementada.
- El paneo de pellizco solo se probó visualmente en un render headless (sin gesto real); el usuario validó el zoom en su iPhone pero el paneo de dos dedos todavía no se confirmó en dispositivo real.

## Trabajo en curso: mejoras para móvil (rama `mejoras-moviles`)

Rama separada de `main`, todavía no mergeada. Resumen de lo hecho ahí, de más a menos reciente:
1. Se probó un nuevo fondo, `crearRamasDoradas` ("libro mágico": ramas doradas tenues con nodos que se iluminan al azar) — pedido explícito del usuario tras recibir comentarios de otros usuarios, pero **se descartó y se quitó por completo** ("el efecto no es el deseado"); no quedó ningún rastro en el código. Dejó la lección 9 (bug de contraste de color, no de lógica) como aprendizaje reutilizable para cualquier efecto de brillo futuro.
2. Antes de eso, se había quitado el fondo de "bruma celeste" (cielo/nubes) por completo — ver nota en "Estado actual de cada pieza" y lecciones 1/2.
3. Se agregó zoom de pellizco (dos dedos) con paneo — ver bullet de `crearTarjetaFlotante` arriba.
4. Dos rondas de aumento de tamaño de fuente (frente y dorso), subiendo `alto`/`canvas.height` en la misma proporción (lección 8) — motivado por legibilidad para adultos mayores en iPhone 14 Pro.
5. Se quitaron las 2 estrellas (florón ✦) del frente (se mantienen en el dorso), para liberar espacio vertical.

## Cómo correr esto en local

Se necesita un servidor local porque el proyecto usa módulos ES de JavaScript (no funciona abriendo `index.html` con doble clic). Cualquiera de estos sirve:

```
python3 -m http.server 5500
```

```
npx serve .
```

Sirve en `http://localhost:5500`; para probar en celular, usar la IP LAN de la máquina en la misma red Wi-Fi. (Nota: una sesión previa de este proyecto corrió en Windows sin `python3` real en el PATH y usó un servidor Node ad-hoc fuera del repo — si se repite esa situación en otra máquina, cualquier servidor estático simple de Node funciona igual de bien.)
