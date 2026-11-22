/** Geometry and motion of the copilot's dot-matrix orb, drawn on a square canvas of SIZE backing pixels. */
export const SIZE = 336;

const TAU = Math.PI * 2;
const MID = SIZE / 2;
const RADIUS = SIZE * 0.34;
const FOCAL = 3.2;
const RINGS = 15;
/** Half-width of the cube the dots lock into when stuck. */
const CUBE = 0.6;
const QUARTER = Math.PI / 2;
/** Statuses that reshape the resting sphere; each blends in and out through its own weight. */
const MODES = ['thinking', 'working', 'stuck'];
/** Turn speed around the vertical axis, in radians per second. */
const SPIN = { success: 0.3, thinking: 0.5, working: 0.2, stuck: 0 };

/** Dots laid out in latitude rings; neighbouring rings turn in opposite directions while working. */
const DOTS = [];
for (let ring = 0; ring < RINGS; ring++) {
  const lat = -1.4 + (2.8 * ring) / (RINGS - 1);
  const ringR = Math.cos(lat);
  const count = Math.max(6, Math.round(34 * ringR));
  for (let i = 0; i < count; i++) {
    DOTS.push({
      y: Math.sin(lat),
      ringR,
      angle: (i / count) * TAU,
      dir: ring % 2 ? 1 : -1,
      dim: ring % 3 ? 1 : 0,
      phase: (DOTS.length * 2.399963) % TAU,
    });
  }
}

export const createOrbMotion = () => ({ t: 0, yaw: 0.6, gear: 0, w: { thinking: 0, working: 0, stuck: 0 } });

/** Advances the motion by `dt` seconds, easing each mode's weight toward the current status by factor `k`. */
export function stepOrb(s, status, k, dt) {
  MODES.forEach((mode) => {
    s.w[mode] += ((status === mode ? 1 : 0) - s.w[mode]) * k;
  });
  s.t += dt;
  s.gear += dt * 1.5 * s.w.working;
  s.yaw += dt * SPIN[status];
  if (status === 'stuck') {
    // Settle on the nearest corner-on view so the cube reads as a cube.
    const target = Math.round((s.yaw - QUARTER / 2) / QUARTER) * QUARTER + QUARTER / 2;
    s.yaw += (target - s.yaw) * k;
  }
}

export function drawOrb(ctx, s) {
  const { thinking, working, stuck } = s.w;
  const tilt = -0.38 - 0.24 * stuck;
  const cy = Math.cos(s.yaw);
  const sy = Math.sin(s.yaw);
  const ct = Math.cos(tilt);
  const st = Math.sin(tilt);
  ctx.clearRect(0, 0, SIZE, SIZE);
  DOTS.forEach((dot) => {
    const a = dot.angle + dot.dir * s.gear;
    const x = dot.ringR * Math.cos(a);
    const z = dot.ringR * Math.sin(a);
    // Thinking: a wave travelling upward plus single dots popping outward.
    const bump = 0.06 * Math.sin(s.t * 1.7 - dot.y * 5) + 0.24 * Math.max(0, Math.sin(s.t * 2.3 + dot.phase)) ** 4;
    const r = 1 + thinking * bump;
    const box = CUBE / Math.max(Math.abs(x), Math.abs(dot.y), Math.abs(z));
    const m = r + (box - r) * stuck;
    const x1 = (x * cy + z * sy) * m;
    const z1 = (z * cy - x * sy) * m;
    const y2 = dot.y * m * ct - z1 * st;
    const z2 = dot.y * m * st + z1 * ct;
    const p = FOCAL / (FOCAL - z2);
    const depth = Math.min(1, Math.max(0, (z2 + 1) / 2));
    ctx.globalAlpha = (0.16 + 0.8 * depth) * (1 - working * 0.5 * dot.dim);
    ctx.beginPath();
    ctx.arc(MID + x1 * p * RADIUS, MID - y2 * p * RADIUS, SIZE * (0.004 + 0.008 * depth) * p, 0, TAU);
    ctx.fill();
  });
}