import React from 'react';
import { motion } from 'framer-motion';
import { letterEntrance } from './copilotEntrance';

/** Serif welcome heading that types in quickly, letter by letter. Screen readers get the whole text at once. */
export default function CopilotHeading({ text }) {
  return (
    <h2 aria-label={text} className="mt-3 font-serif text-[46px] leading-[1.1] text-foreground">
      {Array.from(text).map((char, i) => (
        <motion.span key={i} aria-hidden="true" className="inline-block whitespace-pre" {...letterEntrance(i)}>
          {char}
        </motion.span>
      ))}
    </h2>
  );
}