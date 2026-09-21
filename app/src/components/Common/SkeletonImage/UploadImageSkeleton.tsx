'use client';

import { useState, type ReactNode } from 'react';
import type { UploadFile } from 'antd/es/upload/interface';
import { ImageSkeleton } from './SkeletonImage';
import css from './SkeletonImage.module.css';

export default function UploadImageSkeleton({ node, file }: { node: ReactNode; file: UploadFile }) {
  const [readyKey, setReadyKey] = useState<string | null>(null);
  const imageKey = file.thumbUrl ?? file.url ?? file.preview ?? file.uid;
  const ready = readyKey === imageKey;

  return (
    <span
      className={css.uploadFrame}
      onLoadCapture={() => setReadyKey(imageKey)}
      onErrorCapture={() => setReadyKey(imageKey)}
    >
      {node}
      {!ready && <ImageSkeleton />}
    </span>
  );
}
