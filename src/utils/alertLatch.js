// Keeps a FALL alert active until the patient is actually back on their feet
// (or staff acknowledge it) -- instead of following the model label, which can
// flip back to STABLE within a second or two of a fall.

export const ALERT_LATCH_CLASSES = ['FALL', 'IMMOBILE'];
export const UPRIGHT_TORSO_MAX_DEG = 30; // torso within 30 deg of vertical
export const UPRIGHT_LEG_TORSO_RATIO_MIN = 1.0; // hip-to-ankle height vs torso length (standing ~1.5+, crouch/sitting/lying <0.8); scale-independent so far-away people still work
export const RECOVERY_HOLD_MS = 2500; // must stay upright this long to clear

const L_SH = 11, R_SH = 12, L_HIP = 23, R_HIP = 24, L_ANK = 27, R_ANK = 28;

/** frame132 = 33 landmarks x (x,y,z,visibility). Returns true/false, or null if no frame. */
export function isUpright(frame132) {
  if (!frame132 || frame132.length !== 132) return null;
  const p = (i) => [frame132[i * 4], frame132[i * 4 + 1]];
  const mid = (a, b) => [(p(a)[0] + p(b)[0]) / 2, (p(a)[1] + p(b)[1]) / 2];
  const sh = mid(L_SH, R_SH);
  const hip = mid(L_HIP, R_HIP);
  const ank = mid(L_ANK, R_ANK);
  const torsoDeg =
    (Math.atan2(Math.abs(hip[0] - sh[0]), Math.abs(hip[1] - sh[1]) + 1e-6) * 180) / Math.PI;
  const torsoLen = Math.hypot(hip[0] - sh[0], hip[1] - sh[1]);
  if (torsoLen < 1e-4) return null;
  const legRatio = Math.abs(ank[1] - hip[1]) / torsoLen;
  return torsoDeg < UPRIGHT_TORSO_MAX_DEG && legRatio >= UPRIGHT_LEG_TORSO_RATIO_MIN;
}

export function createLatch() {
  return { active: false, since: null, uprightSince: null, dismissed: false };
}

/** Pure state step. upright: true | false | null (null = patient not in view). */
export function stepLatch(state, { cls, upright, now }) {
  const s = { ...state };
  const inAlertClass = ALERT_LATCH_CLASSES.includes(cls);

  if (!inAlertClass) s.dismissed = false; // acknowledged episode is over

  if (!s.active) {
    if (inAlertClass && !s.dismissed) {
      s.active = true;
      s.since = now;
      s.uprightSince = null;
    }
    return s;
  }

  if (upright === true) {
    if (s.uprightSince === null) s.uprightSince = now;
    if (now - s.uprightSince >= RECOVERY_HOLD_MS) {
      s.active = false;
      s.since = null;
      s.uprightSince = null;
    }
  } else {
    // lying/sitting on the floor, or out of view: NOT recovered
    s.uprightSince = null;
  }
  return s;
}

export function acknowledgeLatch(state) {
  return { active: false, since: null, uprightSince: null, dismissed: true };
}
