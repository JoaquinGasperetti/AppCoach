# Reto 7D Coach — Prototipo web

Prototipo navegable de la app **Reto 7D Coach**: un reto interactivo de 7 días guiado por una coach ontológica profesional, pensado como herramienta de marketing y generación de clientes (ver documento de diseño / GDD).

**Demo online:** https://joaquingasperetti.github.io/AppCoach/

> 💡 El prototipo está orientado a **dispositivos móviles**. En una computadora, se recomienda abrirlo con las herramientas de desarrollador en modo móvil, o directamente desde el teléfono.

## Qué incluye el prototipo

- **Pantalla de bienvenida** con explicación del reto y disclaimer legal.
- **Reto de 7 días**: cada día tiene consigna, audio de la coach y actividad reflexiva. Los días se desbloquean al completar el anterior.
- **Audios reales de la coach**: los 7 audios grabados, con reproductor propio (play/pausa y salto tocando la onda).
- **Progreso persistente**: el avance y las reflexiones se guardan en el dispositivo (localStorage).
- **Monetización simulada**: banner en el inicio, anuncio a pantalla completa al completar un día y anuncio voluntario (recompensado) para desbloquear afirmaciones extra. La compra para quitar anuncios queda para una versión posterior.
- **Conversión a clientes**: invitación a reservar sesión al completar el día 3 y el día 7 (con descuento). Los enlaces de WhatsApp/email son de demostración.
- **Aviso legal** visible: la app no reemplaza procesos terapéuticos.

## Para revisar todo rápido

En el menú (☰) hay un **modo demo** que desbloquea los 7 días, y un botón para **reiniciar el reto**.

## Contenido editable

Los textos, consignas y guiones de audio de los 7 días están en [`docs/js/content.js`](docs/js/content.js) y pueden reemplazarse por el contenido definitivo de la coach sin tocar el resto del código.

## Tecnología

HTML, CSS y JavaScript puros, sin dependencias. Funciona como sitio estático (GitHub Pages) y como app Android vía [Capacitor](https://capacitorjs.com).

## Estructura

```
docs/                    la app (GitHub Pages sirve desde acá, y Capacitor la empaqueta)
  index.html
  css/styles.css
  js/content.js          contenido de los 7 días — editable sin tocar el código
  js/app.js              lógica de la app
capacitor.config.json    configuración de la app Android
ANDROID.md               guía para compilar y publicar en Google Play
```

## Publicar en Google Play

Ver [ANDROID.md](ANDROID.md): qué instalar, cómo generar el proyecto Android y el checklist de Play Console.
