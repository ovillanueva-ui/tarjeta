# Tarjeta Digital Interactiva 3D — ejemplo funcional

Este es un ejemplo completo y navegable del proyecto descrito en `PLAN.md`,
con contenido de muestra en `js/config.js` (nombre, fechas, mensaje y fotos
de ejemplo). Sirve para validar el concepto antes de poner el contenido real.

## Ver en local

Se necesita un servidor local porque el proyecto usa módulos ES de JavaScript.

```
python -m http.server 5500
```

o con Node:

```
npx serve .
```

Abrir `http://localhost:5500` en el navegador. Para probarlo en el celular,
usar la IP local de la computadora en la misma red Wi-Fi (por ejemplo
`http://192.168.1.50:5500`).

## Qué hace este ejemplo

- Pantalla inicial con una vela apagada; al tocar el botón se enciende con
  una llama animada y empiezan a flotar pétalos de cempasúchil y mariposas.
- Una tarjeta 3D que se puede girar arrastrando y que se abre al tocarla,
  mostrando fechas, dedicatoria y mensaje.
- Una galería 3D de fotos deslizable (tipo carrusel), con flechas y puntos
  de posición.
- Un botón de música: como `musica` está en `null` en el ejemplo, usa un
  sonido ambiental generado en el propio navegador para que el control sea
  funcional; al poner un archivo `.mp3` real en `config.js` se reproduce ese
  archivo en su lugar.
- Si el navegador no soporta WebGL, se muestra automáticamente una versión
  2D de respaldo con el mismo contenido.

## Fotos de ejemplo

`js/config.js` referencia 4 fotos. Solo una (`ejemplo-1.svg`) existe
realmente en `assets/photos/`; las otras tres están declaradas pero no
existen a propósito, para demostrar que la tarjeta nunca se rompe: si el
archivo no se encuentra, se genera automáticamente una imagen de marcador
con el pie de foto. Al reunir las fotos reales, basta con copiarlas a
`assets/photos/` y poner el nombre exacto del archivo en `config.js`.

## Librería 3D

Three.js v0.160.0 está incluido localmente en `js/vendor/three/` (sin
`npm install`), tal como pide el plan. `index.html` usa un *import map*
para que `import * as THREE from "three"` funcione sin herramientas de
compilación.

## Siguiente paso

Si este ejemplo refleja lo que buscas, el siguiente paso es reemplazar el
contenido de `js/config.js` por los datos reales y las fotos/música en
`assets/`, y luego seguir con la Fase 7 (GitHub + Vercel) del `PLAN.md`.
