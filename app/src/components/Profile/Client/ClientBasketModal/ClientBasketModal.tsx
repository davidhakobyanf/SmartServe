'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { App, Modal, Spin, Table, Image } from 'antd';
import { useFetching } from '@/hoc/fetchingHook';
import clientAPI from '@/api/api';
import Quantity from '@/hoc/Quantity/Quantity';
import css from './ClientBasketModal.module.css';
import IconButton from '@mui/joy/IconButton';
import { DeleteOutlined } from '@ant-design/icons';
import { normalizeMenuCard, truncateTitle } from '@/lib/normalizeMenuCard';
import { menuCardRowKey } from '@/lib/tableRowKey';
import type { MenuCard, MenuImage } from '@/types';

interface ClientBasketModalProps {
  basketOpen: boolean;
  setBasketOpen: (open: boolean) => void;
  clientId: string;
  images: MenuImage[];
}

export default function ClientBasketModal({
  basketOpen,
  setBasketOpen,
  clientId,
  images,
}: ClientBasketModalProps) {
  const t = useTranslations('client');
  const { message } = App.useApp();
  const [basketData, setBasketData] = useState<MenuCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputWidth, setInputWidth] = useState('100px');
  const [media, setMedia] = useState(0);

  const [fetchBasket, , basketError] = useFetching(async () => {
    try {
      const { data: raw } = await clientAPI.getMine();
      setBasketData((raw ?? []).map((item) => normalizeMenuCard(item)));
    } catch (error) {
      console.error('Error fetching basket:', error);
    } finally {
      setLoading(false);
    }
  });

  const [deleteBasket, deleteBasketLoading] = useFetching(
    async (id: string) => {
      try {
        await clientAPI.deleteBasket(id);
      } catch (error) {
        console.error('Error deleting basket item:', error);
      }
    },
  );

  const [deleteAllBasket, deleteAllBasketLoading] = useFetching(async () => {
    try {
      await clientAPI.clearMine();
    } catch (error) {
      console.error('Error clearing basket:', error);
    }
  });

  const [fetchAddOrder] = useFetching(async (card: {
    items: MenuCard[];
    allPrice: number;
  }) => {
    try {
      await clientAPI.createOrder({ items: card.items, allPrice: card.allPrice });
      message.success(t('basket.orderPlaced'));
      await clientAPI.clearMine();
      setBasketData([]);
    } catch (error) {
      console.error('Error creating order:', error);
      message.error(t('basket.orderFailed'));
    }
  });

  const totalPrice = basketData.reduce(
    (total, item) =>
      total +
      item.price * (item.count ?? 1) +
      350 * (item.sauces.length === 0 ? 0 : item.sauces.length),
    0,
  );

  useEffect(() => {
    if (basketOpen) {
      void fetchBasket();
    }
  }, [clientId, basketOpen, deleteBasketLoading, deleteAllBasketLoading]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 600) {
        setInputWidth('50px');
        setMedia(410);
      } else {
        setInputWidth('100px');
        setMedia(0);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleQuantityChange = (newQuantity: number, record: MenuCard) => {
    setBasketData((prev) =>
      prev.map((item) => (item.id === record.id ? { ...item, count: newQuantity } : item)),
    );
  };

  const handleOrder = () => {
    if (basketData.length === 0) return;

    const items = basketData.map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      price:
        item.price * (item.count ?? 1) +
        350 * (item.sauces.length === 0 ? 0 : item.sauces.length),
      sauces: item.sauces ?? [],
      active: item.active,
      image: item.image,
      count: item.count ?? 1,
    }));
    const allPrice = items.reduce((t, item) => t + item.price, 0);
    void fetchAddOrder({ items, allPrice });
  };

  const columns = [
    {
      title: t('basket.colImage'),
      key: 'image',
      render: (_: unknown, record: MenuCard) => (
        <div className={css.imageTitleContainer}>
          <span style={{ width: '100px' }}>{truncateTitle(record.title)}</span>
          <Image
            src={images.find((image) => image.id === record.id)?.src}
            width={100}
            alt=""
          />
        </div>
      ),
    },
    {
      title: t('basket.colPrice'),
      dataIndex: 'price',
      key: 'price',
      render: (text: number, record: MenuCard) => (
        <span>
          {text * (record.count ?? 1) +
            350 * (record.sauces.length === 0 ? 0 : record.sauces.length)}{' '}
          {t('basket.currency')}
        </span>
      ),
    },
    {
      title: t('basket.colCount'),
      key: 'count',
      render: (_: unknown, record: MenuCard) => (
        <div className={css.right_basket}>
          <Quantity
            width={inputWidth}
            quantity={record.count ?? 1}
            setQuantity={(q) => handleQuantityChange(q, record)}
          />
          <IconButton onClick={() => void deleteBasket(record.id)}>
            <DeleteOutlined style={{ color: 'red' }} />
          </IconButton>
        </div>
      ),
    },
  ];

  const errorMessage =
    basketError instanceof Error ? basketError.message : String(basketError ?? '');

  return (
    <Modal
      mask={false}
      open={basketOpen}
      onCancel={() => setBasketOpen(false)}
      footer={null}
      className={css.modal_antd}
    >
      {loading && <Spin size="large" />}
      {!loading && (
        <>
          <Table
            rowKey={(record) => menuCardRowKey(record, `table-${clientId}`)}
            dataSource={basketData}
            columns={columns}
            className={css.table}
            pagination={false}
          />
          <div className={css.all_price}>
            <b>{t('basket.total', { total: totalPrice })}</b>
            <IconButton onClick={handleOrder}>{t('basket.order')}</IconButton>
            <IconButton onClick={() => void deleteAllBasket()}>
              {t('basket.deleteAll')}
            </IconButton>
          </div>
        </>
      )}
      {basketError != null && <p>{t('basket.error', { message: errorMessage })}</p>}
    </Modal>
  );
}
