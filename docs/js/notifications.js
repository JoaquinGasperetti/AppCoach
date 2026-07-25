/* ═══════════ Reto 7D Coach — Recordatorios ═══════════
   Envuelve el plugin LocalNotifications de Capacitor.
   En el navegador no hay forma de disparar un aviso con la app
   cerrada, así que ahí queda inactivo sin romper nada. */

const Notif = (() => {
  "use strict";

  function plugin() {
    const cap = window.Capacitor;
    return cap && cap.Plugins ? cap.Plugins.LocalNotifications : null;
  }

  /** ¿Corriendo dentro de la app nativa con el plugin disponible? */
  function isAvailable() {
    return !!plugin() && !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
  }

  async function requestPermission() {
    const p = plugin();
    if (!p) return false;
    try {
      const res = await p.requestPermissions();
      return res && res.display === "granted";
    } catch {
      return false;
    }
  }

  async function hasPermission() {
    const p = plugin();
    if (!p) return false;
    try {
      const res = await p.checkPermissions();
      return res && res.display === "granted";
    } catch {
      return false;
    }
  }

  /** Aviso puntual para cuando se desbloquea el día siguiente. */
  async function scheduleUnlock(dayNum, at) {
    const p = plugin();
    if (!p) return false;
    const day = DAYS[dayNum - 1];
    if (!day) return false;
    try {
      await p.schedule({
        notifications: [
          {
            id: dayNum,
            title: `Día ${dayNum} desbloqueado 🌱`,
            body: `Te espera «${day.title}». Son solo 3 minutos.`,
            schedule: { at },
            smallIcon: "ic_stat_icon",
          },
        ],
      });
      return true;
    } catch {
      return false;
    }
  }

  /** Recordatorio suave si abandonó el reto por 3 días. */
  async function scheduleComeback(fromDate) {
    const p = plugin();
    if (!p) return false;
    const at = new Date(fromDate.getTime() + 3 * 24 * 60 * 60 * 1000);
    try {
      await p.schedule({
        notifications: [
          {
            id: 99,
            title: "Tu reto te está esperando",
            body: "Retomá donde lo dejaste. Tres minutos alcanzan para volver a vos.",
            schedule: { at },
            smallIcon: "ic_stat_icon",
          },
        ],
      });
      return true;
    } catch {
      return false;
    }
  }

  async function cancelAll() {
    const p = plugin();
    if (!p) return;
    try {
      const pending = await p.getPending();
      if (pending && pending.notifications && pending.notifications.length) {
        await p.cancel({ notifications: pending.notifications });
      }
    } catch {
      /* nada que cancelar */
    }
  }

  return { isAvailable, requestPermission, hasPermission, scheduleUnlock, scheduleComeback, cancelAll };
})();
