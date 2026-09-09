import { useState } from 'react';
import { Image } from 'antd';
import { useTranslations } from 'next-intl';
import { TbPhotoOff, TbZoomIn } from 'react-icons/tb';
import type { MenuCard } from '@/types';
import { resolveMenuImageSrc } from '@/lib/menuImages';
import css from './Orders.module.css';

export default function OrderDishPhoto({ item }: { item: MenuCard }) {
  const t = useTranslations('orders');
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const src = item.image?.hasData || item.image?.name ? resolveMenuImageSrc(item) : null;
  if (!src || failedSrc === src) return (
    <span className={css.photoFallback} role="img" aria-label={t('board.noPhoto')}>
      <TbPhotoOff aria-hidden="true" /><small>{t('board.noPhoto')}</small>
    </span>
  );
  return <Image src={src} alt={item.title} width={76} height={76} loading="lazy"
    className={css.dishPhoto} onError={() => setFailedSrc(src)}
    preview={{ mask: <TbZoomIn aria-label={t('board.enlargePhoto')} /> }} />;
}
