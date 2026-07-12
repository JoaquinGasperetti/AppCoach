/* ═══════════ Reto 7D Coach — Lógica del prototipo ═══════════ */

(() => {
  "use strict";

  /* ─────────── Estado (localStorage) ─────────── */
  const STORAGE_KEY = "reto7d-state";

  const defaultState = {
    onboarded: false,
    completed: [],      // números de día completados
    reflections: {},    // { 1: "texto", ... }
    premium: false,     // "compra" simulada para quitar anuncios
    extraUnlocked: false,
    demo: false,        // modo demo: todos los días desbloqueados
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

  let currentDay = null; // día abierto en la vista de día

  /* ─────────── Navegación entre vistas ─────────── */
  function showView(id) {
    stopAudio();
    document.querySelectorAll(".view").forEach((v) => v.classList.remove("active"));
    $(id).classList.add("active");
    window.scrollTo(0, 0);
    $("ad-banner").classList.toggle("show", id === "view-home" && !state.premium);
  }

  function openOverlay(id) { $(id).hidden = false; }
  function closeOverlay(id) { $(id).hidden = true; }

  /* ─────────── Inicio ─────────── */
  function nextDayNumber() {
    for (let i = 1; i <= 7; i++) if (!state.completed.includes(i)) return i;
    return null; // reto completo
  }

  function isUnlocked(num) {
    if (state.demo || state.completed.includes(num)) return true;
    return num === nextDayNumber();
  }

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
      const completed = state.completed.includes(day.num);
      const unlocked = isUnlocked(day.num);
      const isCurrent = !completed && unlocked;

      const btn = document.createElement("button");
      btn.className =
        "day-item " +
        (completed ? "is-done" : isCurrent ? "is-current" : "is-locked");
      btn.innerHTML = `
        <span class="day-num">${day.num}</span>
        <span class="day-info">
          <strong>${day.title}</strong>
          <small>${
            completed
              ? "Completado"
              : isCurrent
              ? "Disponible · 3 min"
              : "Se desbloquea al completar el día anterior"
          }</small>
        </span>
        <span class="day-state">${completed ? "✓" : isCurrent ? "→" : "🔒"}</span>`;

      btn.addEventListener("click", () => {
        if (!isUnlocked(day.num)) return;
        openDay(day.num);
      });
      list.appendChild(btn);
    });

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
      saveState();
    }

    if (state.premium) {
      showDone(currentDay);
    } else {
      runCountdownAd("overlay-ad", "btn-ad-close", "Continuar", () =>
        showDone(currentDay)
      );
    }
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
        ? "Completaste los 7 días. Reservá tu primera sesión de coaching con un 20% de descuento y sigamos este camino juntos."
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

  /* ─────────── Ajustes ─────────── */
  function renderSettings() {
    $("premium-title").textContent = state.premium ? "Premium activo ✓" : "Quitar anuncios";
    $("premium-desc").textContent = state.premium
      ? "Gracias por apoyar a tu coach. Sin anuncios."
      : "Versión premium · USD 2,99 (simulación)";
    $("demo-desc").textContent = state.demo
      ? "Activado: los 7 días están desbloqueados"
      : "Desbloquear los 7 días para revisar el prototipo";
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
    $("set-premium").addEventListener("click", () => {
      if (!state.premium) {
        const ok = confirm(
          "Simulación de compra:\n\n¿Activar la versión premium sin anuncios por USD 2,99?\n\n(En el prototipo no se cobra nada)"
        );
        if (!ok) return;
        state.premium = true;
        saveState();
      } else {
        state.premium = false; // permite alternar para la demo
        saveState();
      }
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

    $("set-reset").addEventListener("click", () => {
      const ok = confirm("¿Reiniciar el reto? Se borrará tu progreso y tus reflexiones.");
      if (!ok) return;
      state = { ...defaultState, onboarded: true };
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
