# Guía: de prototipo web a app en Google Play

El proyecto ya está configurado para Capacitor. La carpeta `docs/` cumple doble función: es lo que sirve GitHub Pages (la demo web) y es también lo que Capacitor empaqueta dentro de la app Android. Un solo lugar para editar, dos destinos.

---

## 1. Requisitos previos

| Programa | Para qué | Nota |
|---|---|---|
| [Node.js LTS](https://nodejs.org) | Ejecutar Capacitor | Instalador estándar de Windows |
| [Android Studio](https://developer.android.com/studio) | SDK, emulador y compilación | ~10 GB con el SDK |

Android Studio ya incluye el Java que hace falta: no instales un JDK por separado.

Al abrir Android Studio por primera vez, dejá que descargue el **Android SDK** que te propone el asistente de bienvenida.

## 2. Generar el proyecto Android

Desde la raíz del repositorio:

```bash
npm install
```

```bash
npx cap add android
```

Eso crea la carpeta `android/` con el proyecto nativo. Después, cada vez que cambies algo en `docs/`:

```bash
npx cap sync
```

Y para abrirlo en Android Studio:

```bash
npx cap open android
```

Desde Android Studio se corre con el botón ▶, sea en el emulador o en tu celular conectado por USB con la depuración USB activada.

## 3. El identificador de la app

Está en `capacitor.config.json` como `appId`, hoy con el valor provisional `com.retocoach.app`.

> ⚠️ **Cambialo antes de la primera publicación.** Una vez que la app está en Play, el `appId` no se puede modificar nunca más: para cambiarlo habría que publicar una app nueva y perder descargas y reseñas. Si lo tocás, hacelo antes de correr `npx cap add android`.

## 4. Lo que falta implementar

El prototipo simula cuatro cosas que en la app real necesitan código nativo.

### 4.1 Audios reales

Hoy `docs/js/app.js` usa `speechSynthesis` (la voz del teléfono) como demostración. Cuando la coach grabe los audios:

1. Guardar los archivos como `docs/audio/dia-1.mp3` … `dia-7.mp3`.
2. Agregar a cada día en `docs/js/content.js` un campo `audioFile`.
3. Reemplazar el reproductor simulado por un `<audio>` real de HTML5, que dentro de Capacitor funciona sin plugin.

Formato recomendado: MP3, mono, 96 kbps. Con 7 audios de 30–60 segundos, la app pesa apenas unos pocos MB.

### 4.2 Anuncios (AdMob)

```bash
npm install @capacitor-community/admob
```

Hay que crear una cuenta gratuita en AdMob y generar tres unidades de anuncio: banner, intersticial y recompensado. En el prototipo ya están los tres puntos de integración marcados en `app.js`: `ad-banner`, `runCountdownAd()` para el intersticial y `handleExtra()` para el recompensado.

Durante el desarrollo usá los **IDs de prueba de Google**, nunca los tuyos reales: hacer clic en tus propios anuncios de producción es motivo de suspensión de la cuenta de AdMob.

### 4.3 Compra para quitar anuncios

Google obliga a usar Play Billing para contenido digital y cobra 15% hasta el primer millón de dólares anuales. No se puede usar Mercado Pago ni otro medio de pago para esto.

Lo más práctico es [RevenueCat](https://www.revenuecat.com), que tiene plugin de Capacitor y es gratis hasta cierto volumen. Resuelve la validación de la compra, que es la parte molesta de hacer a mano.

El botón de reservar sesión por WhatsApp **no** entra en esta regla: es un servicio prestado fuera de la app, y Google no cobra comisión sobre eso.

### 4.4 Notificaciones diarias

```bash
npm install @capacitor/local-notifications
```

No está en el prototipo, pero es lo que más mueve la aguja de retención: un recordatorio a la misma hora cada día es la diferencia entre que la persona termine el reto o lo abandone en el día 2. Desde Android 13 hay que pedir permiso explícito al usuario.

### 4.5 Ícono y splash

```bash
npm install -D @capacitor/assets
```

Se coloca un ícono de 1024×1024 en `assets/icon.png` y el plugin genera todos los tamaños que Android necesita.

## 5. Compilar para publicar

En Android Studio: **Build → Generate Signed Bundle / APK → Android App Bundle**.

Play exige formato **AAB**, no APK. La primera vez te va a pedir crear un *keystore*: es el archivo que firma la app.

> 🔑 **Guardá el keystore y su contraseña en un lugar seguro y con backup.** Si lo perdés, no podés volver a actualizar la app nunca más. Activá también *Play App Signing* en la consola, que te da una red de seguridad ante ese escenario. El `.gitignore` ya está configurado para que el keystore no se suba al repositorio por accidente.

## 6. Checklist de Play Console

- [ ] Definir el `appId` definitivo (antes de publicar)
- [ ] Política de privacidad con URL pública — obligatoria porque AdMob recolecta el ID de publicidad. Se puede hostear en el mismo GitHub Pages
- [ ] Formulario de **Data Safety** declarando ese ID de publicidad
- [ ] Cuestionario de clasificación de contenido (IARC)
- [ ] Ícono 512×512 y gráfico destacado 1024×500
- [ ] Entre 2 y 8 capturas de pantalla del teléfono
- [ ] Descripción corta (80 caracteres) y larga (4000)
- [ ] Apuntar al target API que Play exija — el mínimo sube cada agosto
- [ ] Declarar que la app contiene anuncios

Sobre la revisión: Google mira con más atención las apps de bienestar y salud. El aviso de que la app no reemplaza procesos terapéuticos, que ya está visible en la bienvenida y en el menú, juega a favor. Conviene no usar en la ficha de Play palabras que suenen a promesa terapéutica ("cura", "tratamiento", "ansiedad") y mantener el vocabulario en desarrollo personal y autoconocimiento.

## 7. Actualizar la app más adelante

En `android/app/build.gradle` se sube el `versionCode` (un entero, siempre mayor al anterior) y el `versionName` (lo que ve el usuario, por ejemplo `1.1`). Después se genera un AAB nuevo y se sube a Play. Las actualizaciones suelen revisarse en horas, más rápido que la primera publicación.
