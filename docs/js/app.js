/* ═══════════ Reto 7D Coach — Lógica del prototipo ═══════════ */

(() => {
  "use strict";

  /* Un ejercicio por día: el siguiente se abre 24 h después de completar
     el anterior. */
  const LOCK_MS = 24 * 60 * 60 * 1000;

  /* ─────────── Estado (localStorage) ─────────── */
  const STORAGE_KEY = "reto7d-state";

  const defaultState = {
    onboarded: false,
    completed: [],      // números de día completados
    completedAt: {},    // { 1: timestamp } — para calcular las 24 h
    reflections: {},    // { 1: "texto", ... }
    extraUnlocked: false,
    notifEnabled: false,
    notifAsked: false,  // el permiso se pide una sola vez, sin insistir
  };

  let state = loadState();

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? { ...defaultState, ...JSON.parse(raw) } : { ...defaultState };
    } catch {
      return { ...defaultState };
    }
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* modo incógnito: seguimos sin persistencia */
    }
  }

  const $ = (id) => document.getElementById(id);

  let currentDay = null;   // día abierto en la vista de día
  let countdownTimer = null;

  /* ─────────── Navegación entre vistas ─────────── */
  function showView(id) {
    stopAudio();
    document.querySelectorAll(".view").forEach((v) => v.classList.remove("active"));
    $(id).classList.add("active");
    window.scrollTo(0, 0);
    mostrarBannerEn(id === "view-home");
    if (id === "view-home") startCountdown();
    else stopCountdown();
  }

  /* El banner solo va en el inicio. En la app real lo dibuja AdMob por
     encima del contenido; en la web se usa el recuadro de simulación. */
  function mostrarBannerEn(visible) {
    if (Ads.esNativo()) {
      $("ad-banner").classList.remove("show");
      if (visible) Ads.mostrarBanner();
      else Ads.ocultarBanner();
    } else {
      $("ad-banner").classList.toggle("show", visible);
    }
  }

  function openOverlay(id) { $(id).hidden = false; }
  function closeOverlay(id) { $(id).hidden = true; }

  /* ─────────── Desbloqueo por días ─────────── */
  function nextDayNumber() {
    for (let i = 1; i <= 7; i++) if (!state.completed.includes(i)) return i;
    return null; // reto completo
  }

  /** Momento en que se abre un día (timestamp). 0 si ya está disponible. */
  function unlockAt(num) {
    if (num === 1) return 0;
    const prevAt = state.completedAt[num - 1];
    return prevAt ? prevAt + LOCK_MS : 0;
  }

  /** "done" | "available" | "waiting" | "locked" */
  function dayStatus(num) {
    if (state.completed.includes(num)) return "done";
    if (num > 1 && !state.completed.includes(num - 1)) return "locked";
    return Date.now() >= unlockAt(num) ? "available" : "waiting";
  }

  function formatRemaining(ms) {
    const total = Math.max(0, Math.ceil(ms / 60000)); // minutos
    const h = Math.floor(total / 60);
    const m = total % 60;
    if (h > 0) return m > 0 ? `${h} h ${m} min` : `${h} h`;
    return m <= 1 ? "menos de 1 min" : `${m} min`;
  }

  /* ─────────── Inicio ─────────── */
  function renderProgressBar(el) {
    el.innerHTML = "";
    for (let i = 1; i <= 7; i++) {
      const seg = document.createElement("span");
      if (state.completed.includes(i)) seg.classList.add("done");
      el.appendChild(seg);
    }
  }

  function renderHome() {
    const next = nextDayNumber();
    const done = state.completed.length;

    $("progress-label").textContent = next ? `Día ${next} de 7` : "¡Reto completado!";
    $("progress-count").textContent = `${done}/7 completados`;
    renderProgressBar($("progress-bar"));

    const hints = {
      0: "Empezá hoy: son solo 3 minutos.",
      3: "¡Vas por la mitad! Tu constancia está construyendo algo.",
      7: "Completaste el reto. Es un gran momento para dar el próximo paso.",
    };
    $("progress-hint").textContent =
      hints[done] || "Un día a la vez. Hoy también contás con vos.";

    // Lista de días
    const list = $("day-list");
    list.innerHTML = "";
    DAYS.forEach((day) => {
      const status = dayStatus(day.num);

      const labels = {
        done: "Completado",
        available: "Disponible · 3 min",
        waiting: `Se abre en ${formatRemaining(unlockAt(day.num) - Date.now())}`,
        locked: "Se desbloquea al completar el día anterior",
      };
      const icons = { done: "✓", available: "→", waiting: "⏳", locked: "🔒" };
      const cls = {
        done: "is-done",
        available: "is-current",
        waiting: "is-waiting",
        locked: "is-locked",
      };

      const btn = document.createElement("button");
      btn.className = "day-item " + cls[status];
      btn.dataset.day = day.num;
      btn.innerHTML = `
        <span class="day-num">${day.num}</span>
        <span class="day-info">
          <strong>${day.title}</strong>
          <small class="day-label">${labels[status]}</small>
        </span>
        <span class="day-state">${icons[status]}</span>`;

      btn.addEventListener("click", () => {
        const s = dayStatus(day.num);
        if (s === "waiting" || s === "locked") return;
        openDay(day.num);
      });
      list.appendChild(btn);
    });

    renderNextUnlock();

    // Tarjeta de contenido extra
    if (state.extraUnlocked) {
      $("extra-card-desc").textContent = "Ya desbloqueaste tus 7 afirmaciones de regalo.";
      $("btn-extra").textContent = "Ver";
    } else {
      $("extra-card-desc").textContent =
        "Mirá un anuncio breve para desbloquear 7 afirmaciones de regalo.";
      $("btn-extra").textContent = "Desbloquear";
    }

    $("ad-banner").classList.add("show");
  }

  /** Aviso superior con la cuenta regresiva del próximo día. */
  function renderNextUnlock() {
    const next = nextDayNumber();
    const box = $("next-unlock");
    if (!next || dayStatus(next) !== "waiting") {
      box.hidden = true;
      return;
    }
    box.hidden = false;
    $("next-unlock-time").textContent =
      `Día ${next} disponible en ${formatRemaining(unlockAt(next) - Date.now())}`;
    $("next-unlock-text").textContent = state.notifEnabled
      ? "Te avisamos con una notificación cuando se abra."
      : "Un ejercicio por día, para que lo trabajado tenga tiempo de asentarse.";
  }

  /* La cuenta regresiva se refresca sola mientras se mira el inicio. */
  function startCountdown() {
    stopCountdown();
    countdownTimer = setInterval(() => {
      const next = nextDayNumber();
      if (!next) return stopCountdown();
      if (dayStatus(next) === "waiting") {
        renderNextUnlock();
        const item = document.querySelector(`.day-item[data-day="${next}"] .day-label`);
        if (item) {
          item.textContent = `Se abre en ${formatRemaining(unlockAt(next) - Date.now())}`;
        }
      } else {
        renderHome(); // se cumplieron las 24 h
      }
    }, 30000);
  }

  function stopCountdown() {
    if (countdownTimer) clearInterval(countdownTimer);
    countdownTimer = null;
  }

  /* ─────────── Vista de un día ─────────── */
  function openDay(num) {
    currentDay = num;
    const day = DAYS[num - 1];
    const completed = state.completed.includes(num);

    $("day-badge").textContent = `Día ${num}`;
    $("day-title").textContent = day.title;
    $("day-consigna").textContent = day.consigna;
    $("day-activity").textContent = day.activity;
    $("day-reflection").value = state.reflections[num] || "";

    $("btn-complete").hidden = completed;
    $("day-completed-note").hidden = !completed;

    loadAudio(day);
    showView("view-day");
  }

  /* ─────────── Reproductor de audio ───────────
     Reproduce las grabaciones reales de la coach (docs/audio/).
     La onda es decorativa: el relleno sigue el progreso real. */

  const WAVE_BARS = 28;
  let audioEl = null;

  function buildWaveform() {
    const wf = $("waveform");
    if (wf.children.length === WAVE_BARS) return;
    wf.innerHTML = "";
    for (let i = 0; i < WAVE_BARS; i++) {
      const bar = document.createElement("i");
      bar.style.height = 20 + Math.round(Math.abs(Math.sin(i * 1.7)) * 70) + "%";
      wf.appendChild(bar);
    }
  }

  function fmtTime(s) {
    if (!isFinite(s)) return "–:––";
    return Math.floor(s / 60) + ":" + String(Math.floor(s % 60)).padStart(2, "0");
  }

  function ensureAudioEl() {
    if (audioEl) return audioEl;
    audioEl = new Audio();
    audioEl.preload = "metadata";
    audioEl.addEventListener("loadedmetadata", updateAudioUI);
    audioEl.addEventListener("timeupdate", updateAudioUI);
    audioEl.addEventListener("play", updateAudioUI);
    audioEl.addEventListener("pause", updateAudioUI);
    audioEl.addEventListener("ended", updateAudioUI);
    audioEl.addEventListener("error", onAudioError);
    return audioEl;
  }

  function loadAudio(day) {
    const el = ensureAudioEl();
    stopAudio();
    buildWaveform();
    $("btn-play").disabled = false;
    $("audio-error").hidden = true;
    el.src = day.audioFile;
    el.load();
    updateAudioUI();
  }

  /** Si el MP3 falta o no se puede decodificar, se avisa sin romper el día. */
  function onAudioError() {
    $("btn-play").disabled = true;
    $("audio-error").hidden = false;
    $("audio-current").textContent = "0:00";
    $("audio-total").textContent = "–:––";
  }

  function updateAudioUI() {
    const el = audioEl;
    if (!el) return;
    const playing = !el.paused && !el.ended;
    const dur = el.duration;

    $("audio-current").textContent = fmtTime(el.currentTime);
    $("audio-total").textContent = fmtTime(dur);

    const bars = $("waveform").children;
    const ratio = isFinite(dur) && dur > 0 ? el.currentTime / dur : 0;
    const played = Math.round(ratio * bars.length);
    for (let i = 0; i < bars.length; i++) {
      bars[i].classList.toggle("played", i < played);
    }

    $("icon-play").style.display = playing ? "none" : "";
    $("icon-pause").style.display = playing ? "" : "none";
  }

  function toggleAudio() {
    const el = ensureAudioEl();
    if (el.paused || el.ended) {
      if (el.ended) el.currentTime = 0;
      el.play().catch((err) => {
        // NotAllowedError = el navegador pidió un gesto del usuario, no es
        // un fallo del archivo: no tiene sentido avisar de un error de carga.
        if (err && err.name === "NotAllowedError") return;
        onAudioError();
      });
    } else {
      el.pause();
    }
  }

  /** Tocar la onda salta a ese punto del audio. */
  function seekAudio(evt) {
    const el = audioEl;
    if (!el || !isFinite(el.duration)) return;
    const box = $("waveform").getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (evt.clientX - box.left) / box.width));
    el.currentTime = ratio * el.duration;
    updateAudioUI();
  }

  function stopAudio() {
    if (!audioEl) return;
    audioEl.pause();
    audioEl.currentTime = 0;
    updateAudioUI();
  }

  /* ─────────── Completar día + anuncio intersticial ───────────
     El intersticial va en la transición entre el ejercicio y la pantalla
     de cierre: una pausa natural del contenido, que es la única ubicación
     que permite AdMob. Si el anuncio no carga, se pasa de largo. */
  async function completeDay() {
    if (!currentDay) return;
    const dia = currentDay;
    saveReflection();
    if (!state.completed.includes(dia)) {
      state.completed.push(dia);
      state.completedAt[dia] = Date.now();
      saveState();
      scheduleReminders(dia);
    }

    if (Ads.esNativo()) {
      await Ads.mostrarIntersticial();
      showDone(dia);
    } else {
      runCountdownAd("overlay-ad", "btn-ad-close", "Continuar", () => showDone(dia));
    }
  }

  /** Programa el aviso de desbloqueo del día siguiente. */
  async function scheduleReminders(num) {
    if (!state.notifEnabled || !Notif.isAvailable()) return;
    const next = num + 1;
    if (next > 7) return;
    await Notif.scheduleUnlock(next, new Date(state.completedAt[num] + LOCK_MS));
  }

  function saveReflection() {
    if (!currentDay) return;
    const text = $("day-reflection").value.trim();
    if (text) state.reflections[currentDay] = text;
    else delete state.reflections[currentDay];
    saveState();
  }

  /* Cuenta regresiva genérica para anuncios simulados */
  function runCountdownAd(overlayId, btnId, label, onClose) {
    const btn = $(btnId);
    let remaining = 5;
    btn.disabled = true;
    btn.textContent = `${label} en ${remaining}…`;
    openOverlay(overlayId);

    const iv = setInterval(() => {
      remaining--;
      if (remaining > 0) {
        btn.textContent = `${label} en ${remaining}…`;
      } else {
        clearInterval(iv);
        btn.disabled = false;
        btn.textContent = label;
      }
    }, 1000);

    btn.onclick = () => {
      closeOverlay(overlayId);
      btn.onclick = null;
      onClose();
    };
  }

  /* ─────────── Pantalla de día completado ─────────── */
  function showDone(num) {
    const day = DAYS[num - 1];
    const done = state.completed.length;
    const finished = done === 7;

    $("done-title").textContent = finished
      ? "¡Completaste el reto! 🎉"
      : `¡Día ${num} completado!`;
    $("done-quote").textContent = day.quote;
    renderProgressBar($("done-progress"));
    $("done-progress-label").textContent = `${done} de 7 días completados`;

    // Aviso de la espera de 24 h
    const nextBox = $("done-next");
    if (!finished && num < 7) {
      nextBox.hidden = false;
      $("done-next-title").textContent = "Nos vemos mañana ⏳";
      $("done-next-text").textContent = state.notifEnabled
        ? `El Día ${num + 1} se abre en 24 h. Te avisamos con una notificación.`
        : `El Día ${num + 1} se abre en 24 h. Activá los recordatorios en el menú para que te avisemos.`;
    } else {
      nextBox.hidden = true;
    }

    // Invitación a reservar sesión (días 3 y 7 según el GDD)
    const showCta = num === 3 || num === 7;
    $("done-cta").hidden = !showCta;
    if (showCta) {
      const isFinal = num === 7;
      $("cta-badge").textContent = isFinal ? "20% de descuento" : "Beneficio especial";
      $("cta-title").textContent = isFinal
        ? "Diste el primer gran paso"
        : "¿Te gustaría ir más profundo?";
      $("cta-text").textContent = isFinal
        ? "Completaste los 7 días. Escribime por Instagram y coordinamos tu primera sesión con un 20% de descuento."
        : "Reservá una sesión de coaching individual y trabajemos juntos lo que apareció en estos días.";
    }

    showView("view-done");
  }

  function openBooking(withDiscount) {
    $("book-discount").hidden = !withDiscount;
    openOverlay("modal-book");
  }

  /* ─────────── Contenido extra (anuncio recompensado) ───────────
     Siempre voluntario: el usuario decide verlo. Si cierra el anuncio
     antes de terminarlo no se entrega el premio, como exige AdMob, pero
     tampoco se le impide seguir usando la app. */
  async function handleExtra() {
    closeOverlay("sheet-settings");
    if (state.extraUnlocked) {
      openExtraList();
      return;
    }

    if (Ads.esNativo()) {
      const ganado = await Ads.mostrarBonificado();
      if (!ganado) {
        alert("El regalo se desbloquea al ver el anuncio completo. Podés intentarlo de nuevo cuando quieras.");
        return;
      }
      desbloquearExtra();
    } else {
      runCountdownAd("overlay-reward", "btn-reward-close", "Ver mi regalo", desbloquearExtra);
    }
  }

  function desbloquearExtra() {
    state.extraUnlocked = true;
    saveState();
    renderHome();
    renderSettings();
    openExtraList();
  }

  function openExtraList() {
    const list = $("extra-list");
    list.innerHTML = "";
    EXTRA_AFFIRMATIONS.forEach((a) => {
      const li = document.createElement("li");
      li.textContent = a;
      list.appendChild(li);
    });
    openOverlay("modal-extra");
  }

  /* ─────────── Recordatorios ─────────── */

  /** Pide el permiso una sola vez, al arrancar el reto. Si el usuario dice
      que no, no se vuelve a insistir: queda el interruptor del menú. */
  async function askNotificationsOnce() {
    if (state.notifAsked || !Notif.isAvailable()) return;
    state.notifAsked = true;
    saveState();

    const granted = (await Notif.hasPermission()) || (await Notif.requestPermission());
    if (!granted) return;

    state.notifEnabled = true;
    saveState();
    renderHome();

    // Si ya había un día esperando las 24 h, programa su aviso.
    const next = nextDayNumber();
    if (next && next > 1 && dayStatus(next) === "waiting") {
      await Notif.scheduleUnlock(next, new Date(unlockAt(next)));
    }
  }

  async function toggleNotifications() {
    if (!Notif.isAvailable()) {
      alert(
        "Los recordatorios funcionan en la app instalada desde Google Play.\n\nEn la versión web del prototipo no se pueden enviar avisos con la app cerrada."
      );
      return;
    }
    if (state.notifEnabled) {
      state.notifEnabled = false;
      await Notif.cancelAll();
      saveState();
    } else {
      const granted = (await Notif.hasPermission()) || (await Notif.requestPermission());
      if (!granted) {
        alert("Para recibir recordatorios hay que permitir las notificaciones desde los ajustes del teléfono.");
        return;
      }
      state.notifEnabled = true;
      saveState();
      // Reprograma el aviso del próximo día si hay uno en espera
      const next = nextDayNumber();
      if (next && next > 1 && dayStatus(next) === "waiting") {
        await Notif.scheduleUnlock(next, new Date(unlockAt(next)));
      }
    }
    renderSettings();
    renderHome();
  }

  /* ─────────── Ajustes ─────────── */
  function renderSettings() {
    $("notif-title").textContent = state.notifEnabled ? "Recordatorios activados ✓" : "Recordatorios";
    $("notif-desc").textContent = state.notifEnabled
      ? "Te avisamos cuando se abra el próximo día"
      : Notif.isAvailable()
      ? "Que te avisemos cuando se abra el próximo día"
      : "Disponible en la app instalada, no en la web";

    $("set-extra-desc").textContent = state.extraUnlocked
      ? "Contenido desbloqueado · Ver afirmaciones"
      : "Desbloqueá contenido viendo un anuncio";

    // Solo aparece donde la normativa de consentimiento aplica (Europa).
    $("set-privacidad").hidden = !Ads.requierePrivacidad();
  }

  /* ─────────── Eventos ─────────── */
  function bindEvents() {
    // Bienvenida
    $("btn-start").addEventListener("click", () => {
      state.onboarded = true;
      saveState();
      renderHome();
      showView("view-home");
      askNotificationsOnce();
    });

    // Inicio
    $("btn-settings").addEventListener("click", () => {
      renderSettings();
      openOverlay("sheet-settings");
    });
    $("btn-legal").addEventListener("click", () => openOverlay("modal-legal"));
    $("btn-extra").addEventListener("click", handleExtra);

    // Día
    $("btn-back").addEventListener("click", () => {
      saveReflection();
      renderHome();
      showView("view-home");
    });
    $("btn-play").addEventListener("click", toggleAudio);
    $("waveform").addEventListener("click", seekAudio);
    $("btn-complete").addEventListener("click", completeDay);
    $("day-reflection").addEventListener("blur", saveReflection);

    // Día completado
    $("btn-done-home").addEventListener("click", () => {
      renderHome();
      showView("view-home");
    });
    $("btn-book").addEventListener("click", () =>
      openBooking(state.completed.length === 7)
    );

    // Ajustes
    $("set-notif").addEventListener("click", toggleNotifications);

    $("set-extra").addEventListener("click", handleExtra);

    $("set-book").addEventListener("click", () => {
      closeOverlay("sheet-settings");
      openBooking(state.completed.length === 7);
    });

    $("set-privacidad").addEventListener("click", async () => {
      closeOverlay("sheet-settings");
      await Ads.abrirOpcionesPrivacidad();
    });

    $("set-legal").addEventListener("click", () => {
      closeOverlay("sheet-settings");
      openOverlay("modal-legal");
    });

    $("set-reset").addEventListener("click", async () => {
      const ok = confirm("¿Reiniciar el reto? Se borrará tu progreso y tus reflexiones.");
      if (!ok) return;
      const keepNotif = state.notifEnabled;
      await Notif.cancelAll();
      // Reiniciar el reto no vuelve a pedir el permiso: ya se decidió una vez.
      state = { ...defaultState, onboarded: true, notifEnabled: keepNotif, notifAsked: true, completedAt: {}, reflections: {} };
      saveState();
      renderSettings();
      renderHome();
      closeOverlay("sheet-settings");
      showView("view-home");
    });

    // Cierre de modales (botón ✕ y clic afuera)
    document.querySelectorAll(".modal-close").forEach((btn) => {
      btn.addEventListener("click", () => closeOverlay(btn.dataset.close));
    });
    ["modal-book", "modal-extra", "modal-legal", "sheet-settings"].forEach((id) => {
      $(id).addEventListener("click", (e) => {
        if (e.target === $(id)) closeOverlay(id);
      });
    });

    // Al volver a la app, recalcula si ya se cumplieron las 24 h
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden && $("view-home").classList.contains("active")) renderHome();
    });

  }

  /* ─────────── Arranque ─────────── */
  async function init() {
    bindEvents();

    // El consentimiento y el SDK se resuelven antes de pedir el primer
    // anuncio. Si tarda o falla, la app ya está usable igual.
    Ads.init().then(() => {
      if ($("view-home").classList.contains("active")) mostrarBannerEn(true);
    });

    if (state.onboarded) {
      renderHome();
      showView("view-home");
      // Quien ya había pasado la bienvenida antes de que existiera este pedido
      // también recibe la consulta, una sola vez.
      askNotificationsOnce();
    } else {
      showView("view-welcome");
    }
  }

  init();
})();
