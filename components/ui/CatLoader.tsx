'use client';

import Lottie from 'lottie-react';
import loaderAnimation from '@/public/cat_loading.json';

type CatLoaderProps = {
  size?: number;
  className?: string;
};

export function CatLoader({ size = 200, className }: CatLoaderProps) {
  return (
    <div className={className} aria-label="Loading" role="status">
      <Lottie
        animationData={loaderAnimation}
        loop={true}
        style={{ width: size, height: size }}
      />
    </div>
  );
}
