import React, { useEffect, useRef } from 'react';
import { SIZE, createOrbMotion, drawOrb, stepOrb } from './copilotOrbMotion';

const LABELS = { success: 'Ready', thinking: 'Thinking', working: 'Working', stuck: 'Waiting for you' };
const GLOW = { success: 0.34, thinking: 0.24, working: 0.24, stuck: 0.12 };

/**
 * Dot-matrix orb for the copilot chat pane. `status` picks its motion: success rests in a slow turn,
 * thinking bubbles outward, working spins its rings against each other, stuck locks into a cube.
 */
export default function CopilotOrb({ status, size }) {
  const canvasRef = useRef(null);
  const motionRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = window.getComputedStyle(canvas).color;
    motionRef.current ||= createOrbMotion();
    const motion = motionRef.current;
    // Reduced motion: draw each status as a single still frame.
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let frame;
    let last = performance.now();
    const tick = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      stepOrb(motion, status, still ? 1 : 1 - Math.exp(-dt * 5), still ? 0 : dt);
      drawOrb(ctx, motion);
      if (!still) frame = requestAnimationFrame(tick);
    };
    tick(last);
    return () => cancelAnimationFrame(frame);
  }, [status]);

  return (
    <div
      role="img"
      aria-label={LABELS[status]}
      className="relative shrink-0 transition-[width,height] duration-500 ease-out"
      style={{ width: size, height: size }}
    >
      <div
        className="absolute inset-[18%] rounded-full bg-copilot-orb blur-2xl transition-opacity duration-700"
        style={{ opacity: GLOW[status] }}
      />
      <canvas ref={canvasRef} width={SIZE} height={SIZE} className="relative h-full w-full text-copilot-orb" />
    </div>
  );
}