import React from 'react';
import { cn } from '@/lib/utils';

/** The artwork is drawn on a 200px canvas; this 108px region centred at (100, 79) just holds the face and is fitted into the tile. */
const REGION = 108;
const CENTRE_X = 100;
const CENTRE_Y = 79;

const Eye = ({ side }) => (
  <div className={cn('genie-p genie-eye', side)}>
    <div className="genie-p genie-pupil">
      <div className="genie-p genie-shine" />
    </div>
  </div>
);

/** Genie's face: a CSS-drawn avatar on a transparent background that floats and blinks. Scales to any `size`. */
export default function GenieAvatar({ size = 32, className }) {
  const scale = size / REGION;
  const transform = `translate(${size / 2 - CENTRE_X * scale}px, ${size / 2 - CENTRE_Y * scale}px) scale(${scale})`;

  return (
    <div aria-hidden="true" className={cn('genie-avatar', className)} style={{ width: size, height: size }}>
      <div className="genie-art" style={{ transform }}>
        <div className="genie-bob">
          <div className="genie-p genie-head" />
          <div className="genie-p genie-turban" />
          <div className="genie-p genie-band" />
          <div className="genie-p genie-gem" />
          <div className="genie-blink">
            <Eye side="l" />
            <Eye side="r" />
          </div>
          <div className="genie-p genie-mouth">
            <div className="genie-p genie-tongue" />
          </div>
          <div className="genie-p genie-cheek l" />
          <div className="genie-p genie-cheek r" />
        </div>
      </div>
    </div>
  );
}