# Guía: de prototipo web a app en Google Play

El proyecto ya está configurado para Capacitor. La carpeta `docs/` cumple doble función: es lo que sirve GitHub Pages (la demo web) y es también lo que Capacitor empaqueta dentro de la app Android. Un solo lugar para editar, dos destinos.

---

## 1. Entorno

| Programa | Versión verificada |
|---|---|
| [Node.js](https://nodejs.org) | v24.18.0 |
| npm | 11.16.0 |
| [Android Studio](https://developer.android.com/studio) | con SDK 36.1 y build-tools 36.0.0 |
| JDK 21 (incluido en Android Studio) | 21.0.10 |

> ⚠️ **No uses el Java del sistema para compilar.** Si tenés un JDK 25 instalado aparte, Gradle no lo soporta. Compilando desde Android Studio esto se resuelve solo, porque usa su JDK 21 interno. Si necesitás la línea de comandos, exportá primero:
>
> ```bash
> JAVA_HOME="C:\Program Files\Android\Android Studio\jbr"
> ```

## 2. Flujo de trabajo

La carpeta `android/` **ya está generada y commiteada**, con Capacitor 8 apuntando a `targetSdk 36` y `minSdk 24` (Android 7 en adelante, ~98% de los dispositivos).

Después de clonar el repo por primera vez:

```bash
npm install
```

Cada vez que cambies algo en `docs/`, para pasar los cambios a la app:

```bash
npx cap sync
```

Y para abrir el proyecto en Android Studio:

```bash
npx cap open android
```

Desde Android Studio se corre con el botón ▶, sea en el emulador o en tu celular conectado por USB con la depuración USB activada.

Para compilar un APK de prueba sin abrir Android Studio:

```bash
cd android && ./gradlew assembleDebug
```

El APK queda en `android/app/build/outputs/apk/debug/app-debug.apk` (~4 MB). La primera compilación tarda varios minutos porque descarga Gradle y las dependencias; las siguientes son mucho más rápidas.

## 3. El identificador de la app

El identificador definitivo es **`com.HKemtrentainment.retocoach`**.

> ⚠️ **No se puede cambiar después de publicar.** Una vez que la app está en Play, el `appId` queda fijo para siempre: modificarlo obliga a publicar una app nueva, perdiendo descargas y reseñas. Verificá que esté bien escrito antes de la primera subida.

Vive en cinco lugares que tienen que coincidir. Si alguna vez hay que cambiarlo, hay que tocar los cinco:

| Archivo | Qué contiene |
|---|---|
| `capacitor.config.json` | `appId` |
| `android/app/build.gradle` | `namespace` y `applicationId` |
| `android/app/src/main/res/values/strings.xml` | `package_name` y `custom_url_scheme` |
| `android/app/src/main/java/com/HKemtrentainment/retocoach/` | la ruta de carpetas del código |
| `MainActivity.java` | la línea `package` |

## 4. Lo que falta implementar

El prototipo simula cuatro cosas que en la app real necesitan código nativo.

### 4.1 Audios reales — ✅ hecho

Los 7 audios de la coach están en `docs/audio/dia-1.mp3` … `dia-7.mp3` (MP3 128 kbps, entre 26 y 51 segundos, 3,9 MB en total) y se referencian desde el campo `audioFile` de cada día en `docs/js/content.js`.

El reproductor usa el `Audio` nativo del navegador, sin plugin: funciona igual en la web y dentro de Capacitor. La onda es decorativa pero el relleno sigue el progreso real, y se puede tocar para saltar a un punto. Si un archivo faltara o no se pudiera decodificar, se muestra un aviso y se deshabilita el botón en lugar de romper el día.

Para reemplazar un audio, basta con pisar el archivo correspondiente en `docs/audio/` y correr `npx cap sync`.

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

## 5. Firma de la app

**Ya está configurada.** El keystore existe y Gradle lo usa automáticamente para la variante `release`.

| | |
|---|---|
| Keystore | `retocoach-upload.jks` (raíz del proyecto) |
| Alias | `retocoach` |
| Algoritmo | RSA 2048 · SHA384withRSA |
| Válido hasta | 10 de diciembre de 2053 |
| SHA-1 | `65:2C:F3:C7:CB:62:35:69:9C:DF:34:C7:E3:73:96:C4:44:AF:5A:F4` |
| SHA-256 | `93:65:5F:DA:82:15:10:3D:59:BA:19:86:61:88:FE:4B:18:44:6D:61:05:9E:A1:C8:18:14:EC:40:93:02:9C:94` |

Las credenciales viven en `android/keystore.properties`, que **no está en el repositorio**. Junto con el `.jks`, son los dos archivos que hay que copiar a mano si trabajás desde otra computadora. Si faltan, el proyecto igual compila: solo avisa que el release sale sin firmar.

Para confirmar en cualquier momento que la firma está bien enganchada, sin generar ningún archivo:

```bash
cd android && ./gradlew :app:signingReport
```

> 🔑 **Hacé backup del `.jks` y su contraseña.** Con Play App Signing —obligatorio para apps nuevas— este archivo es la *clave de subida*, no la de firma real, así que si se pierde o se filtra Google puede resetearla. Aun así, recuperarla es un trámite que frena cualquier actualización urgente.

## 6. Generar el AAB para publicar

Play exige formato **AAB**, no APK:

```bash
cd android && ./gradlew bundleRelease
```

Queda en `android/app/build/outputs/bundle/release/app-release.aab`, ya firmado. También se puede desde Android Studio con **Build → Generate Signed Bundle / APK**.

Antes de generarlo, subí el `versionCode` en `android/app/build.gradle` si ya habías publicado una versión anterior.

## 7. Checklist de Play Console

- [x] ~~Definir el `appId` definitivo~~ → `com.HKemtrentainment.retocoach`
- [x] ~~Crear el keystore de firma~~ → configurado, ver sección 5
- [ ] Política de privacidad con URL pública — obligatoria porque AdMob recolecta el ID de publicidad. Se puede hostear en el mismo GitHub Pages
- [ ] Formulario de **Data Safety** declarando ese ID de publicidad
- [ ] Cuestionario de clasificación de contenido (IARC)
- [ ] Ícono 512×512 y gráfico destacado 1024×500
- [ ] Entre 2 y 8 capturas de pantalla del teléfono
- [ ] Descripción corta (80 caracteres) y larga (4000)
- [ ] Apuntar al target API que Play exija — el mínimo sube cada agosto
- [ ] Declarar que la app contiene anuncios

Sobre la revisión: Google mira con más atención las apps de bienestar y salud. El aviso de que la app no reemplaza procesos terapéuticos, que ya está visible en la bienvenida y en el menú, juega a favor. Conviene no usar en la ficha de Play palabras que suenen a promesa terapéutica ("cura", "tratamiento", "ansiedad") y mantener el vocabulario en desarrollo personal y autoconocimiento.

## 8. Actualizar la app más adelante

En `android/app/build.gradle` se sube el `versionCode` (un entero, siempre mayor al anterior) y el `versionName` (lo que ve el usuario, por ejemplo `1.1`). Después se genera un AAB nuevo y se sube a Play. Las actualizaciones suelen revisarse en horas, más rápido que la primera publicación.
