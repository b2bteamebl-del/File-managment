/**
 * Mobile Sound, Vibration (Haptics), and Native Push Notification Utility
 * Synthesizes classic SMS chimes via Web Audio API (zero external assets needed)
 * and triggers device vibration and native browser push notifications like SMS.
 */

// Web Audio API synthesizer for classic mobile SMS chime
export function playMobileSmsChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    // First Tone (High pitch chime: 880Hz - A5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, now);
    osc1.frequency.exponentialRampToValueAtTime(1046.5, now + 0.1); // Ramp to C6
    gain1.gain.setValueAtTime(0.3, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.25);

    // Second Tone (Sweet resolving harmonic: 1318.5Hz - E6)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1318.5, now + 0.12);
    gain2.gain.setValueAtTime(0.28, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.45);
  } catch {
    // Audio may be prevented by autoplay policy before user gesture
  }
}

// Trigger device vibration like a phone receiving an SMS
export function triggerMobileVibration() {
  try {
    if ('vibrate' in navigator && typeof navigator.vibrate === 'function') {
      // Classic SMS pattern: buzz (200ms) - pause (100ms) - buzz (200ms)
      navigator.vibrate([200, 100, 200]);
    }
  } catch {
    // Vibration not supported or blocked
  }
}

// Request native browser notification permission
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    return 'denied';
  }
  if (Notification.permission === 'granted') {
    return 'granted';
  }
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch {
    return 'denied';
  }
}

// Dispatch native system push notification (appears on lock screen / phone top bar like SMS)
export function showSystemMobileNotification(title: string, body: string, onClick?: () => void) {
  // Always trigger sound & vibration
  playMobileSmsChime();
  triggerMobileVibration();

  // Also dispatch in-app SMS toast event
  const customEvent = new CustomEvent('ebl-mobile-sms-notification', {
    detail: { title, body, timestamp: new Date().toISOString() },
  });
  window.dispatchEvent(customEvent);

  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      const notification = new Notification(title, {
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: `ebl_sms_${Date.now()}`,
        // vibrate is supported in Chrome Android
        ...({ vibrate: [200, 100, 200] } as any),
      });

      if (onClick) {
        notification.onclick = () => {
          window.focus();
          onClick();
          notification.close();
        };
      }
    } catch {
      // Fallback handled by in-app toast
    }
  }
}
