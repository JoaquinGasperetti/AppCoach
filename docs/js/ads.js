/* ═══════════ Reto 7D Coach — Anuncios (AdMob) ═══════════

   Envuelve @capacitor-community/admob. Reglas que sigue este módulo:

   · Los anuncios NUNCA bloquean al usuario. Si algo falla —sin conexión,
     sin inventario, error del SDK— se continúa como si no hubiera anuncio.
   · En el navegador no hay AdMob: la app usa las simulaciones del prototipo.
   · Antes de pedir cualquier anuncio se resuelve el consentimiento (UMP),
     obligatorio para usuarios del Espacio Económico Europeo, Reino Unido
     y Suiza desde enero de 2024. */

const Ads = (() => {
  "use strict";

  /* ⚠️ MODO PRUEBA ⚠️
     En true se usan las unidades de prueba de Google. Dejarlo así durante
     todo el desarrollo: hacer clic en un anuncio real propio es motivo de
     suspensión de la cuenta de AdMob.
     Poner en false SOLO en el build que se sube a producción. */
  const MODO_PRUEBA = true;

  const REALES = {
    banner: "ca-app-pub-2266949018056491/6988049903",
    interstitial: "ca-app-pub-2266949018056491/3048804892",
    rewarded: "ca-app-pub-2266949018056491/2857233203",
  };

  // Unidades públicas de prueba de Google (Android)
  const PRUEBA = {
    banner: "ca-app-pub-3940256099942544/6300978111",
    interstitial: "ca-app-pub-3940256099942544/1033173712",
    rewarded: "ca-app-pub-3940256099942544/5224354917",
  };

  const ID = MODO_PRUEBA ? PRUEBA : REALES;

  let plugin = null;
  let listo = false;
  let bannerVisible = false;
  let opcionesPrivacidad = false;

  function nativo() {
    const cap = window.Capacitor;
    return !!(cap && cap.isNativePlatform && cap.isNativePlatform() && cap.Plugins && cap.Plugins.AdMob);
  }

  function log(...a) {
    if (MODO_PRUEBA) console.log("[Ads]", ...a);
  }

  /* ─────────── Consentimiento (UMP) ─────────── */
  async function resolverConsentimiento() {
    try {
      const info = await plugin.requestConsentInfo();
      log("consentimiento:", info.status);

      if (info.isConsentFormAvailable && info.status === "REQUIRED") {
        await plugin.showConsentForm();
      }
      // Queda disponible en el menú para que el usuario pueda cambiarlo
      // después, tal como exige la normativa europea.
      opcionesPrivacidad = info.status !== "NOT_REQUIRED";
    } catch (e) {
      // Si el consentimiento falla, se sigue: el SDK servirá anuncios
      // limitados o no personalizados, que es el comportamiento correcto.
      log("consentimiento falló, se continúa", e);
    }
  }

  /* ─────────── Inicialización ─────────── */
  async function init() {
    if (!nativo() || listo) return listo;
    plugin = window.Capacitor.Plugins.AdMob;
    try {
      await plugin.initialize({
        initializeForTesting: MODO_PRUEBA,
        // La app es para adultos: no es contenido dirigido a menores.
        tagForChildDirectedTreatment: false,
        tagForUnderAgeOfConsent: false,
        // Evita anuncios inapropiados junto a contenido de coaching.
        maxAdContentRating: "PG",
      });
      await resolverConsentimiento();
      listo = true;
      log("inicializado", MODO_PRUEBA ? "(PRUEBA)" : "(PRODUCCIÓN)");
    } catch (e) {
      log("no se pudo inicializar", e);
      listo = false;
    }
    return listo;
  }

  /* ─────────── Banner ─────────── */
  async function mostrarBanner() {
    if (!listo || bannerVisible) return false;
    try {
      await plugin.showBanner({
        adId: ID.banner,
        adSize: "ADAPTIVE_BANNER",
        position: "BOTTOM_CENTER",
        margin: 0,
        isTesting: MODO_PRUEBA,
      });
      bannerVisible = true;
      return true;
    } catch (e) {
      log("banner falló", e);
      return false;
    }
  }

  async function ocultarBanner() {
    if (!listo || !bannerVisible) return;
    try {
      await plugin.hideBanner();
    } catch (e) {
      log("ocultar banner falló", e);
    }
    bannerVisible = false;
  }

  /* ─────────── Intersticial ───────────
     Se muestra en la transición de completar un día, que es una pausa
     natural del contenido. Nunca al abrir ni al cerrar la app, ni en
     medio de una tarea: eso está expresamente prohibido por AdMob. */
  async function mostrarIntersticial() {
    if (!listo) return false;
    try {
      await plugin.prepareInterstitial({ adId: ID.interstitial, isTesting: MODO_PRUEBA });
      await plugin.showInterstitial();
      return true;
    } catch (e) {
      log("intersticial no disponible, se continúa", e);
      return false;
    }
  }

  /* ─────────── Bonificado ───────────
     Siempre voluntario. Devuelve true solo si el usuario efectivamente
     ganó la recompensa; si cierra antes, no se entrega el contenido. */
  async function mostrarBonificado() {
    if (!listo) return false;
    try {
      await plugin.prepareRewardVideoAd({ adId: ID.rewarded, isTesting: MODO_PRUEBA });
      const premio = await plugin.showRewardVideoAd();
      return !!(premio && premio.type);
    } catch (e) {
      log("bonificado no disponible", e);
      return false;
    }
  }

  /* ─────────── Opciones de privacidad ───────────
     Los usuarios europeos deben poder revisar su consentimiento cuando
     quieran, no solo la primera vez. */
  function requierePrivacidad() {
    return listo && opcionesPrivacidad;
  }

  async function abrirOpcionesPrivacidad() {
    if (!listo) return false;
    try {
      await plugin.showPrivacyOptionsForm();
      return true;
    } catch (e) {
      log("opciones de privacidad fallaron", e);
      return false;
    }
  }

  return {
    esNativo: nativo,
    modoPrueba: () => MODO_PRUEBA,
    init,
    mostrarBanner,
    ocultarBanner,
    mostrarIntersticial,
    mostrarBonificado,
    requierePrivacidad,
    abrirOpcionesPrivacidad,
  };
})();
