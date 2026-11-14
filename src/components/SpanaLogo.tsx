import React from 'react';

export const SPANA_LOGO_SRC = '/assets/aistudio/image_26f206ae_4bec248c.jpg';

interface SpanaLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
  className?: string;
}

const WORDMARK_CLASSES: Record<NonNullable<SpanaLogoProps['size']>, string> = {
  sm: 'w-36 aspect-[3.35/1]',
  md: 'w-40 sm:w-44 aspect-[3.35/1]',
  lg: 'w-44 sm:w-52 aspect-[3.35/1]'
};

const TAGLINE_CLASSES: Record<NonNullable<SpanaLogoProps['size']>, string> = {
  sm: 'text-[9px] tracking-[0.14em]',
  md: 'text-[10px] sm:text-[10.5px] tracking-[0.16em]',
  lg: 'text-[10.5px] sm:text-[11px] tracking-[0.18em]'
};

/**
 * Renders the Spana wordmark cropped cleanly with zero background frame,
 * paired with the clean "Local.Verified.Safe" tagline directly beneath.
 */
export const SpanaLogo: React.FC<SpanaLogoProps> = ({
  size = 'md',
  showTagline = true,
  className = ''
}) => {
  return (
    <span className={`inline-flex flex-col items-center shrink-0 select-none ${className}`}>
      {/* Cropped frameless SPANA wordmark */}
      <span className={`relative block overflow-hidden ${WORDMARK_CLASSES[size]}`}>
        <img
          src={SPANA_LOGO_SRC}
          alt="Spana"
          referrerPolicy="no-referrer"
          className="absolute max-w-none w-[176%] h-auto left-1/2 top-1/2 -translate-x-[50.35%] -translate-y-[45.9%] brightness-[1.06] contrast-[1.08] mix-blend-multiply pointer-events-none"
        />
      </span>

      {/* Clean typographic tagline just below SPANA */}
      {showTagline && (
        <span className="mt-0.5 flex flex-col items-center w-full">
          <span
            aria-hidden="true"
            className="w-full h-[1.5px] mb-1 rounded-full bg-gradient-to-r from-transparent via-[#F86828]/75 to-transparent"
          />
          <span
            className={`font-bold uppercase leading-none whitespace-nowrap ${TAGLINE_CLASSES[size]}`}
          >
            <span className="text-[#303C43]">Local.Verified.</span>
            <span className="text-[#F86828]">Safe</span>
          </span>
        </span>
      )}
    </span>
  );
};
