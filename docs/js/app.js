/* ═══════════ Reto 7D Coach — Lógica del prototipo ═══════════ */

(() => {
  "use strict";

  /* Un ejercicio por día: el siguiente se abre 24 h después de completar
     el anterior. El modo demo saltea esta espera para poder revisar todo. */
  const LOCK_MS = 24 * 60 * 60 * 1000;

  /* ─────────── Estado (localStorage) ─────────── */
  const STORAGE_KEY = "reto7d-state";

  const defaultState = {
    onboarded: false,
    completed: [],      // números de día completados
    completedAt: {},    // { 1: timestamp } — para calcular las 24 h
    reflections: {},    // { 1: "texto", ... }
    premium: false,     // "compra" simulada para quitar anuncios
    extraUnlocked: false,
    demo: false,        // modo demo: saltea la espera de 24 h
    notifEnabled: false,
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
    $("ad-banner").classList.toggle("show", id === "view-home" && !state.premium);
    if (id === "view-home") startCountdown();
    else stopCountdown();
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
    if (state.demo) return "available";
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

    $("ad-banner").classList.toggle("show", !state.premium);
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

    resetAudioUI(estimateDuration(day.audioScript));
    buildWaveform();
    showView("view-day");
  }

  /* ─────────── Reproductor de audio (demo) ───────────
     Usa la voz del navegador para simular el audio de la coach.
     Si no hay síntesis de voz disponible, simula la reproducción. */

  const WAVE_BARS = 28;
  let audio = { playing: false, elapsed: 0, duration: 30, timer: null, usingSpeech: false };

  function estimateDuration(script) {
    // ~13 caracteres por segundo de habla en español
    return Math.max(15, Math.round(script.length / 13));
  }

  function buildWaveform() {
    const wf = $("waveform");
    wf.innerHTML = "";
    for (let i = 0; i < WAVE_BARS; i++) {
      const bar = document.createElement("i");
      bar.style.height = 20 + Math.round(Math.abs(Math.sin(i * 1.7)) * 70) + "%";
      wf.appendChild(bar);
    }
  }

  function fmtTime(s) {
    return Math.floor(s / 60) + ":" + String(Math.floor(s % 60)).padStart(2, "0");
  }

  function resetAudioUI(duration) {
    stopAudio();
    audio.duration = duration;
    audio.elapsed = 0;
    updateAudioUI();
  }

  function updateAudioUI() {
    $("audio-current").textContent = fmtTime(audio.elapsed);
    $("audio-total").textContent = fmtTime(audio.duration);
    const bars = $("waveform").children;
    const playedCount = Math.round((audio.elapsed / audio.duration) * bars.length);
    for (let i = 0; i < bars.length; i++) {
      bars[i].classList.toggle("played", i < playedCount);
    }
    $("icon-play").style.display = audio.playing ? "none" : "";
    $("icon-pause").style.display = audio.playing ? "" : "none";
  }

  function tick() {
    audio.elapsed = Math.min(audio.elapsed + 0.25, audio.duration);
    if (audio.elapsed >= audio.duration) finishAudio();
    updateAudioUI();
  }

  function playAudio() {
    if (audio.elapsed >= audio.duration) audio.elapsed = 0;
    audio.playing = true;

    if ("speechSynthesis" in window && currentDay) {
      audio.usingSpeech = true;
      if (speechSynthesis.paused) {
        speechSynthesis.resume();
      } else if (!speechSynthesis.speaking) {
        const u = new SpeechSynthesisUtterance(DAYS[currentDay - 1].audioScript);
        u.lang = "es-AR";
        u.rate = 0.95;
        const voice = speechSynthesis
          .getVoices()
          .find((v) => v.lang && v.lang.startsWith("es"));
        if (voice) u.voice = voice;
        u.onend = () => { if (audio.playing) finishAudio(); };
        speechSynthesis.speak(u);
      }
    }

    audio.timer = setInterval(tick, 250);
    updateAudioUI();
  }

  function pauseAudio() {
    audio.playing = false;
    clearInterval(audio.timer);
    if (audio.usingSpeech && speechSynthesis.speaking) speechSynthesis.pause();
    updateAudioUI();
  }

  function finishAudio() {
    audio.playing = false;
    audio.elapsed = audio.duration;
    clearInterval(audio.timer);
    updateAudioUI();
  }

  function stopAudio() {
    audio.playing = false;
    clearInterval(audio.timer);
    if (audio.usingSpeech) {
      speechSynthesis.cancel();
      audio.usingSpeech = false;
    }
  }

  /* ─────────── Completar día + anuncio intersticial ─────────── */
  function completeDay() {
    if (!currentDay) return;
    saveReflection();
    if (!state.completed.includes(currentDay)) {
      state.completed.push(currentDay);
      state.completedAt[currentDay] = Date.now();
      saveState();
      scheduleReminders(currentDay);
    }

    if (state.premium) {
      showDone(currentDay);
    } else {
      runCountdownAd("overlay-ad", "btn-ad-close", "Continuar", () =>
        showDone(currentDay)
      );
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
    if (!finished && num < 7 && !state.demo) {
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

  /* ─────────── Contenido extra (anuncio recompensado) ─────────── */
  function handleExtra() {
    closeOverlay("sheet-settings");
    if (state.extraUnlocked) {
      openExtraList();
    } else {
      runCountdownAd("overlay-reward", "btn-reward-close", "Ver mi regalo", () => {
        state.extraUnlocked = true;
        saveState();
        renderHome();
        renderSettings();
        openExtraList();
      });
    }
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

    $("premium-title").textContent = state.premium ? "Premium activo ✓" : "Quitar anuncios";
    $("premium-desc").textContent = state.premium
      ? "Gracias por apoyar a tu coach. Sin anuncios."
      : "Versión premium · USD 2,99 (simulación)";

    $("demo-desc").textContent = state.demo
      ? "Activado: sin espera entre días"
      : "Saltea la espera de 24 h para revisar el prototipo";

    $("set-extra-desc").textContent = state.extraUnlocked
      ? "Contenido desbloqueado · Ver afirmaciones"
      : "Desbloqueá contenido viendo un anuncio";
  }

  /* ─────────── Eventos ─────────── */
  function bindEvents() {
    // Bienvenida
    $("btn-start").addEventListener("click", () => {
      state.onboarded = true;
      saveState();
      renderHome();
      showView("view-home");
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
    $("btn-play").addEventListener("click", () =>
      audio.playing ? pauseAudio() : playAudio()
    );
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

    $("set-premium").addEventListener("click", () => {
      if (!state.premium) {
        const ok = confirm(
          "Simulación de compra:\n\n¿Activar la versión premium sin anuncios por USD 2,99?\n\n(En el prototipo no se cobra nada)"
        );
        if (!ok) return;
        state.premium = true;
      } else {
        state.premium = false; // permite alternar para la demo
      }
      saveState();
      renderSettings();
      renderHome();
    });

    $("set-extra").addEventListener("click", handleExtra);

    $("set-demo").addEventListener("click", () => {
      state.demo = !state.demo;
      saveState();
      renderSettings();
      renderHome();
    });

    $("set-book").addEventListener("click", () => {
      closeOverlay("sheet-settings");
      openBooking(state.completed.length === 7);
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
      state = { ...defaultState, onboarded: true, notifEnabled: keepNotif, completedAt: {}, reflections: {} };
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

    // Cargar voces (algunos navegadores las cargan de forma asíncrona)
    if ("speechSynthesis" in window) speechSynthesis.getVoices();
  }

  /* ─────────── Arranque ─────────── */
  function init() {
    bindEvents();
    if (state.onboarded) {
      renderHome();
      showView("view-home");
    } else {
      showView("view-welcome");
    }
  }

  init();
})();
