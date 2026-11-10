# Tarjeta memorial 3D — Ludivina Pérez Coronel ("Ludy")

Tarjeta digital interactiva en memoria de Ludivina Pérez Coronel. Proyecto estático,
sin base de datos ni build: HTML + ES modules + Three.js v0.160.0 (vendorizado
localmente en `js/vendor/three/`, sin `npm install`).

> El diseño se alejó del concepto original descrito en `PLAN.md` (tarjeta tipo
> libro, vela, pétalos/mariposas, galería y música). Ese archivo quedó como
> referencia histórica. Lo que describe este README y `CLAUDE.md` es lo que
> realmente está implementado hoy en `js/scene.js`.

## Qué es la tarjeta

Un contenedor 3D flotante, con esquinas redondeadas, que se lee girándolo:

- **Frente**: foto circular, nombre, apodo cariñoso, fechas de nacimiento y
  fallecimiento, mensaje narrativo y lugar.
- **Dorso**: una oración ("Señor, fortalece nuestro corazón... Amén.").
- Se gira **arrastrando** la tarjeta con un dedo o el mouse, o usando el
  enlace **"Ver dorso › / ‹ Ver frente"**, que está dibujado dentro de la
  propia textura 3D (no es un botón de HTML superpuesto).
- **Zoom de pellizco** con dos dedos (acercar/alejar la tarjeta) y, con los
  mismos dos dedos, **paneo** para desplazarse si el zoom deja texto fuera
  de la pantalla. No interfiere con el arrastre de un dedo.
- La tarjeta flota con un suave movimiento vertical, con una sombra debajo
  que reacciona a ese flote.

No hay vela, pétalos, mariposas, galería de fotos, música ni efecto de fondo
— se probaron dos ("bruma celeste"/cielo-nubes, y después unas "ramas
doradas" con nodos que se iluminaban al azar) y ambos se descartaron por
decisión del usuario. Esas piezas del plan original se descartaron también.

## Accesibilidad y respaldo sin WebGL

El texto de la tarjeta solo existe como píxeles dentro de una textura WebGL,
así que todo el contenido se duplica como HTML semántico real
(`#contenido-accesible` en `index.html`, poblado desde `config.js` por
`main.js`), oculto visualmente con `.sr-only` mientras la escena 3D funcione.

- `#boton-girar` es un respaldo de teclado/lector de pantalla (oculto como
  *skip link*, visible solo al recibir foco con Tab) que dispara el mismo
  giro que el enlace dibujado en la textura.
- Si el navegador no soporta WebGL, se elimina el canvas y el botón, y se
  muestra `#contenido-accesible` visible con todo el contenido de corrido.

## Contenido (`js/config.js`)

Único archivo que se edita para personalizar la tarjeta — ya tiene los datos
reales de Ludivina, no datos de ejemplo:

```
nombre, apodoCarinoso, nacimiento, fallecimiento, foto, fotoAlt,
mensajeFrontal (array), fraseDestacada, fraseCierre, lugar   — para el frente
dedicatoria, mensaje (array), firma                          — para el dorso
```

La foto real vive en `foto.jpeg` (raíz del proyecto).

## Ver en local

Se necesita un servidor local porque el proyecto usa módulos ES de JavaScript
(no funciona abriendo `index.html` con doble clic).

```
python3 -m http.server 5500
```

o con Node:

```
npx serve .
```

Abrir `http://localhost:5500` en el navegador. Para probarlo en el celular,
usar la IP local de la computadora en la misma red Wi-Fi (por ejemplo
`http://192.168.1.50:5500`).

## Librería 3D

Three.js v0.160.0 está incluido localmente en `js/vendor/three/` (sin
`npm install`). `index.html` usa un *import map* para que
`import * as THREE from "three"` funcione sin herramientas de compilación.

## Publicación

El código ya vive en GitHub (`ovillanueva-ui/tarjeta`). `vercel.json` incluye
el header `X-Robots-Tag: noindex` para que la página no aparezca en
buscadores. Falta confirmar si ya se desplegó en Vercel; si no, basta con
importar el repositorio en vercel.com con **Framework Preset: Other** y
**Output Directory: `.`**.

## Pendiente conocido

Ver la sección "Pendiente / sin resolver" de `CLAUDE.md` (incluye un reflejo
metálico sin resolver al girar la tarjeta).
