# Tarjeta Digital Interactiva 3D en Memoria de [NOMBRE DE TU TÍA]

Proyecto de homenaje, sin base de datos, 100% estático. Se desarrolla en local, se sube a GitHub y se publica en Vercel.

---

## 1. Decisiones tomadas (cerradas)

| Tema | Decisión |
|---|---|
| Tecnología | HTML + CSS + JavaScript (módulos ES) + **Three.js v0.160.0** |
| Framework / build | Ninguno. No hay `npm install` ni compilación |
| Base de datos | Ninguna. Todo el contenido vive en `js/config.js` y `assets/` |
| Hosting | GitHub (código) + Vercel (publicación estática) |
| Concepto | Tarjeta que se abre en 3D sobre una escena con vela, pétalos de cempasúchil y mariposas flotantes |
| Ambiente | Cálido y respetuoso, con toques tradicionales mexicanos (naranja cempasúchil, tonos oscuros suaves) |
| Interacción | Arrastrar/tocar para rotar la tarjeta, tocar para abrir, tocar la vela para encenderla |
| Música | Opcional, inicia solo cuando la persona toca el botón (los navegadores bloquean el audio automático) |
| Idioma | Español |
| Dispositivos | Móvil primero, también escritorio |
| Privacidad | `noindex` para que no aparezca en buscadores; se comparte solo por enlace |

---

## 2. Experiencia (flujo)

1. **Pantalla inicial**: fondo oscuro cálido, una vela apagada y el texto "Toca para encender una vela".
2. **Encender la vela**: la llama se anima, aparece la luz cálida y comienzan a flotar pétalos y mariposas.
3. **Tarjeta cerrada en 3D**: con el nombre y una foto en la portada; se puede girar con el dedo o el ratón.
4. **Abrir la tarjeta**: al tocarla se abre con animación; muestra fechas, dedicatoria y mensaje.
5. **Galería**: fotos en carrusel 3D, deslizables.
6. **Cierre**: frase final y botón para activar o pausar la música.

---

## 3. Estructura de carpetas

```
tarjeta-memorial/
├── index.html
├── PLAN.md
├── README.md
├── vercel.json
├── .gitignore
├── css/
│   └── styles.css
├── js/
│   ├── config.js        <- ÚNICO archivo donde se edita el contenido
│   ├── main.js          <- arranque y flujo general
│   ├── scene.js         <- escena, cámara, luces, render
│   ├── card.js          <- tarjeta 3D (apertura, rotación)
│   ├── particles.js     <- pétalos y mariposas
│   ├── gallery.js       <- carrusel 3D de fotos
│   └── audio.js         <- control de música
└── assets/
    ├── photos/          <- fotos en .jpg o .webp
    ├── audio/           <- música en .mp3
    └── textures/        <- texturas de papel, pétalos, mariposa
```

---

## 4. Contenido a llenar (`js/config.js`)

Lo único que falta y solo tú puedes aportar. Todo se edita en este archivo:

```
nombre:        "[Nombre completo]"
apodoCariñoso: "[Opcional: cómo le decían]"
nacimiento:    "[DD de mes de AAAA]"
fallecimiento: "[DD de mes de AAAA]"
frasePortada:  "[Ej.: Siempre en nuestros corazones]"
dedicatoria:   "[Texto corto, 1 a 2 líneas]"
mensaje:       "[Mensaje principal, 3 a 6 líneas]"
fotos:         [ { archivo, pie }, ... ]   // 3 a 8 fotos
musica:        "assets/audio/[archivo].mp3" // o null si no habrá
firma:         "[Ej.: Con amor, tu familia]"
```

Reglas para los archivos:
- Fotos: máximo 1600 px de lado y menos de 400 KB cada una (formato `.webp` o `.jpg`).
- Música: `.mp3` de menos de 4 MB. Usar solo música propia o libre de derechos.

---

## 5. Trabajo en local

Los módulos ES requieren un servidor local (no funcionan abriendo el archivo con doble clic).

Opción A (Python, ya instalado en la mayoría de equipos):
```
python3 -m http.server 5500
```
Opción B (Node):
```
npx serve .
```
Abrir `http://localhost:5500` en el navegador. Para probar en el celular, usar la IP local de la computadora en la misma red Wi-Fi.

---

## 6. Publicación

### GitHub
1. Crear repositorio vacío `tarjeta-memorial` (privado o público).
2. En la carpeta del proyecto:
```
git init
git add .
git commit -m "Tarjeta memorial: versión inicial"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/tarjeta-memorial.git
git push -u origin main
```

### Vercel
1. Entrar a vercel.com con la cuenta de GitHub.
2. **Add New > Project** y elegir el repositorio.
3. Configuración: **Framework Preset: Other**, sin Build Command, **Output Directory: `.`** (raíz).
4. **Deploy**. Cada `git push` a `main` publica automáticamente.
5. Opcional: renombrar el dominio en Settings > Domains (ej. `en-memoria-de-nombre.vercel.app`).

`vercel.json` (incluido en el proyecto):
```
{
  "headers": [
    { "source": "/(.*)", "headers": [ { "key": "X-Robots-Tag", "value": "noindex" } ] }
  ]
}
```

---

## 7. Fases de trabajo

Cada fase termina en algo que se puede ver funcionando en local. **Antes de escribir el código de cada fase, se solicita tu autorización.**

| Fase | Entregable | Criterio de aceptación |
|---|---|---|
| 1. Base | Estructura de carpetas, `index.html`, estilos, `config.js` con datos de ejemplo | Abre en local sin errores en consola |
| 2. Escena y vela | Escena 3D, vela con llama animada, fondo cálido | La vela se enciende al tocar |
| 3. Tarjeta 3D | Tarjeta que gira y se abre con tus textos | Se puede rotar y abrir en móvil y escritorio |
| 4. Ambiente | Pétalos y mariposas flotantes | Fluido (mínimo 30 fps en un celular promedio) |
| 5. Galería | Carrusel 3D con tus fotos | Todas las fotos cargan y se deslizan |
| 6. Música | Botón de audio | Suena solo al tocar el botón y se puede pausar |
| 7. Publicación | Repositorio en GitHub y sitio en Vercel | El enlace público funciona en tu celular |

---

## 8. Rendimiento y compatibilidad

- Limitar la densidad de píxeles del render a 2 (`setPixelRatio(Math.min(devicePixelRatio, 2))`).
- Reducir automáticamente la cantidad de partículas en móviles.
- Mostrar una versión 2D de respaldo (texto y fotos) si el dispositivo no soporta WebGL.
- Respetar `prefers-reduced-motion`: menos animación si el usuario lo tiene activado.
- Probar en: Chrome y Safari móvil, Chrome y Firefox de escritorio.

---

## 9. Lista de verificación final

- [ ] Nombre, fechas y mensajes revisados (ortografía y acentos)
- [ ] Fotos optimizadas y con pie de foto
- [ ] Música con permiso de uso
- [ ] Prueba en celular real
- [ ] Sin errores en la consola del navegador
- [ ] Enlace de Vercel abre correctamente
- [ ] Familia con el enlace listo para compartir

---

## 10. Siguiente paso

1. Reunir fotos, mensaje y fechas (sección 4).
2. Confirmar la **autorización para la Fase 1** y continuar fase por fase.
