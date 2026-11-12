'use client';

import React, { useState } from 'react';
import Image from 'next/image';

interface FoodImageProps {
  src: string;
  alt: string;
  sizes: string;
  className?: string;
}

/** next/image with a graceful offline / broken-URL fallback (campus Wi-Fi is flaky). */
export function FoodImage({ src, alt, sizes, className }: FoodImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed || !src) {
    return (
      <div
        role="img"
        aria-label={alt}
        className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-orange-100 to-amber-50 text-3xl"
      >
        🍽️
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      className={className}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  );
}
