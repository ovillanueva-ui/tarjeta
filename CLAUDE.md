# Tarjeta memorial — estado del proyecto

Última actualización: 2026-11-09. Este archivo resume dónde quedó el trabajo para retomarlo sin repetir decisiones ya tomadas.

## Qué es esto

Tarjeta memorial 3D para **Ludivina Pérez Coronel ("Ludy")**, construida a partir de `PLAN.md` pero con un enfoque visual distinto al que describe ese plan (ver "Decisiones que ya cambiaron" abajo). El contenido de `js/config.js` ya es el real (no es un ejemplo inventado). Se está validando el diseño de forma incremental, en vivo, en el navegador — **no hay commits de git todavía, no hay repo** (`git status` confirma que no es un repositorio).

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
  - `ajustarCamaraResponsiva`: calcula la distancia de cámara según el aspecto real de pantalla para que la tarjeta siempre quepa con margen (recalcula en `resize` y `orientationchange`). Margen actual: `1.2`.
  - `crearTarjetaFlotante`: el contenedor aislado — geometría (`ancho=2.0`, `alto=3.2`, agrandada desde `2.8` porque el contenido real del frente no cabía), texturas de frente/dorso, sombra, arrastre con resorte al soltar, flote vertical suave, y el raycasting del enlace "ver dorso/frente" (ver abajo).
  - `diseñarFrente` / `diseñarDorso` + `crearTexturaFrente` / `crearTexturaDorso`: dibujan el texto en un canvas 2D (720×1152, misma proporción que `ancho`/`alto`) con un **sistema de ajuste automático de escala** — miden cuánto espacio necesita el texto antes de dibujar, y si no cabe, reducen la fuente proporcionalmente hasta un piso de `ESCALA_MINIMA_TEXTO = 0.6` (nunca más chico que eso; mejor que se recorte un poco a que sea ilegible). No volver a hardcodear tamaños sin ese paso de medición.
  - `dibujarEnlaceVoltear`: dibuja el enlace "Ver dorso ›" / "‹ Ver frente" **dentro de la propia textura**, al final del frente y del dorso respectivamente, con subrayado trazado a mano. Devuelve la caja clicable en fracciones 0–1 del canvas (`zonaEnlace`), que `crearTarjetaFlotante` usa con un `THREE.Raycaster` en `pointerup` (solo si fue un *tap* — movimiento <6px y <300ms — para no confundirlo con un arrastre de giro) para activar `alternarVista()`.
  - Colores de texto ajustados para contraste AA (4.5:1) sobre el fondo de tarjeta `#f0ebd7`: `ORO_OSCURO = "#84661e"` (antes `#8a6a1f`, 4.22:1) y `ORO_TEXTO = "#806719"` (variante de `ORO` para texto real). `ORO` original (`#c9a227`) se dejó intacto pero **solo para elementos decorativos** (florón ✦, marco) — no usarlo en texto, falla contraste.
  - `crearBrumaCeleste`: efecto de cielo/nubes que reemplazó un efecto anterior llamado "aura celestial". Dimensionada según lo que la cámara ve a cada profundidad (`tamanoVisibleEnProfundidad`), no según el tamaño de la tarjeta.
- `js/main.js` — arranque: detecta WebGL, llena `#contenido-accesible` desde `config.js`, inicializa escena, crea la tarjeta, conecta el clic de `#boton-girar` a `tarjeta.alternarVista()`, corre el loop de render. Si no hay WebGL: quita el canvas y el botón, y muestra `#contenido-accesible` visible (ya trae todo el contenido del frente y del dorso de corrido).
- `js/vendor/three/` — Three.js v0.160.0 + `RoundedBoxGeometry.js` vendorizados (no tocar, son librería externa).

## Accesibilidad e interacción "ver dorso/frente" (decisión importante, no deshacer sin razón)

El texto de la tarjeta solo existe como píxeles dentro de texturas WebGL — invisible para lectores de pantalla, no indexable, no seleccionable. Se resolvió así:

- `#contenido-accesible` (en `index.html`, poblado en `main.js` desde `config.js`): duplica todo el contenido como HTML real semántico (`h1`, `p`, `blockquote`), oculto visualmente con `.sr-only` mientras la escena 3D funcione.
- El control visual para voltear la tarjeta **no es un `<button>` de HTML superpuesto** — se intentó así primero y se descartó: un elemento DOM posicionado sobre el canvas, aunque se le siga la posición del flote, nunca comparte la rotación/perspectiva/iluminación del objeto 3D y se ve "pegado encima" en vez de parte de la tarjeta (ver lección 6 abajo). La solución final fue dibujar el enlace **dentro de la propia textura** (`dibujarEnlaceVoltear`) y detectarlo con raycasting — hereda automáticamente rotación, flote y escorzo, y se "oculta" solo cuando esa cara no mira a cámara (comportamiento por defecto de `MeshBasicMaterial` con `side: FrontSide`).
- `#boton-girar` (HTML) se mantuvo, pero reducido a **respaldo de teclado/lector de pantalla** únicamente — oculto como *skip link*, solo visible al recibir foco con Tab. Dispara el mismo `tarjeta.alternarVista()`.

## Lecciones ya aprendidas (no repetir los mismos errores)

1. **Nunca anidar un efecto decorativo (halo, cielo, partículas) como hijo del grupo que rota/flota.** La bruma vive en su propio grupo, añadido directo a la escena, y solo copia la posición Y (el flote) del contenedor cada frame — nunca su rotación.
2. **Nunca dimensionar un fondo/ambiente en unidades relativas al objeto principal.** Los fondos deben calcularse según lo que la cámara efectivamente ve a esa profundidad (ver `tamanoVisibleEnProfundidad`).
3. **Nunca dibujar texto en un canvas de textura a tamaño fijo sin medir primero**, y **el piso de escala mínima no es gratis**: si el contenido real es más largo que el de prueba, puede llegar al piso (`ESCALA_MINIMA_TEXTO`) y aun así desbordar el área reservada hacia el marco decorativo. La solución no es bajar más el piso (perjudica legibilidad) sino agrandar el `alto` físico de la tarjeta (y el `canvas.height` de las texturas, misma proporción) para dar más margen real. Esto ya pasó una vez con el contenido real de Ludivina.
4. El usuario prefiere iterar **un cambio visual a la vez**, confirmado en vivo en el navegador antes de seguir — no construir varias piezas nuevas de golpe.
5. Reflejo/brillo metálico raro al girar la tarjeta: se mitigó bajando `metalness` a 0 y suavizando las luces, pero el usuario reportó que el efecto **seguía presente** incluso después de aislar la bruma del grupo rotante. **No se investigó más a fondo — sigue pendiente**, ver sección siguiente.
6. **Un elemento de HTML posicionado "encima" de una escena WebGL (aunque se calcule bien su posición en pantalla) se ve pegado/sobrepuesto, no integrado**, porque no comparte rotación, escorzo de perspectiva ni iluminación con los objetos 3D. Si algo necesita sentirse "parte de" un objeto 3D que rota/flota, dibujarlo dentro de la textura del objeto (con raycasting para el clic) en vez de perseguirlo con un overlay de DOM. Validado con el enlace "Ver dorso/Ver frente" — varias iteraciones de reposicionar el botón de HTML no lo arreglaron; moverlo a la textura sí.
7. Al depurar posición en pantalla y no tener navegador en la sesión de CLI: pedir una captura (o una descripción de hacia dónde está desviado) en vez de seguir ajustando matemática a ciegas — ahorra rondas de ida y vuelta.

## Pendiente / sin resolver

- **Reflejo metálico al girar la tarjeta**: el usuario confirmó que persiste ("el efecto prevalece") incluso después de aislar la bruma/aura de la rotación. Puede que no fuera (solo) el aura — revisar si viene de la combinación de `MeshStandardMaterial` + luces direccionales duras sobre la geometría redondeada, o de otra fuente. Pedir al usuario ejemplos concretos (ángulo/momento) si se retoma.
- No se ha decidido si se agregarán fotos reales, música, o cualquier otra pieza del `PLAN.md` original — no asumir, confirmar con el usuario.
- No hay repo git, no se ha hecho ningún commit, no se ha tocado Fase 7 (GitHub/Vercel) del plan original.
- Opcional, no confirmado: cambiar el cursor a `pointer` al pasar sobre la zona del enlace "ver dorso/frente" (raycasting también en `pointermove`) — quedó explícitamente como mejora de fase 2, no implementada.

## Cómo correr esto en local

No hay Python instalado "de verdad" en el sistema (el `python`/`python3` del PATH son solo el stub de Microsoft Store), pero el launcher `py -3` sí funciona (Python 3.14.7) — es lo que usa la skill `ui-ux-pro-max`. Para servir la página se usa un servidor estático propio en Node:

```
node "<ruta-al-script>/servidor-local.js"
```

Sirve en `http://localhost:5500` (y en la IP LAN de la máquina, por si se vuelve a probar en el celular). El script vive fuera del repo, en el directorio scratchpad de la sesión de Claude Code — si no existe, se puede recrear con un `http.createServer` simple que mapee extensiones a content-types (`.js` → `text/javascript`, `.svg` → `image/svg+xml`, etc.) y sirva `C:\Users\ra-cs\proyectos\tarjeta` como raíz.
