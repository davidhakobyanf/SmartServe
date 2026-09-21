'use client';

import { useState, type ComponentProps, type ReactNode } from 'react';
import css from './SkeletonImage.module.css';

type SkeletonImageProps = Omit<ComponentProps<'img'>, 'src' | 'alt' | 'onLoad' | 'onError'> & {
  src: string;
  alt: string;
  fallback?: ReactNode;
  frameClassName?: string;
};

export function ImageSkeleton({ className = '' }: { className?: string }) {
  return <span className={`${css.skeleton} ${className}`} aria-hidden="true" />;
}

export default function SkeletonImage({
  src,
  alt,
  fallback,
  frameClassName = '',
  className,
  loading = 'lazy',
  ...imageProps
}: SkeletonImageProps) {
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const loaded = loadedSrc === src;
  const failed = failedSrc === src;

  return (
    <span className={`${css.frame} ${frameClassName}`} data-loaded={loaded}>
      {!loaded && !failed && <ImageSkeleton />}
      {failed ? fallback : (
        <img
          {...imageProps}
          src={src}
          alt={alt}
          loading={loading}
          className={`${css.image} ${className ?? ''}`}
          onLoad={(event) => {
            const image = event.currentTarget;
            if (typeof image.decode === 'function') {
              void image.decode().catch(() => {}).then(() => setLoadedSrc(src));
            } else {
              setLoadedSrc(src);
            }
          }}
          onError={() => setFailedSrc(src)}
        />
      )}
    </span>
  );
}
