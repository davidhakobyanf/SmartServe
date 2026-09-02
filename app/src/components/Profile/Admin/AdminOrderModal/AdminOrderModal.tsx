'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Modal, Spin, Table, Image, Collapse, Checkbox } from 'antd';
import type { CollapseProps } from 'antd';
import { useFetching } from '@/hoc/fetchingHook';
import clientAPI from '@/api/api';
import css from './AdminOrderModal.module.css';
import IconButton from '@mui/joy/IconButton';
import { DeleteOutlined } from '@ant-design/icons';
import type { MenuImage } from '@/types';
import type { OrderRecord } from '@/types/orders';
import { normalizeOrderRecord, truncateTitle } from '@/lib/normalizeMenuCard';
import { menuCardRowKey } from '@/lib/tableRowKey';
import type { MenuCard } from '@/types';
import { useOrders } from '@/context/OrdersContext';
interface AdminOrderModalProps {
  orderOpen: boolean;
  setOrderOpen: (open: boolean) => void;
  images: MenuImage[];
}

export default function AdminOrderModal({
  orderOpen,
  setOrderOpen,
  images,
}: AdminOrderModalProps) {
  const t = useTranslations('orders');
  const [orderData, setOrderData] = useState<OrderRecord[]>([]);
  const [selectedRows, setSelectedRows] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const { orders: liveOrders } = useOrders();
  const [fetchOrders, , orderError] = useFetching(async () => {
    try {
      const { data: res } = await clientAPI.getOrders();
      const list = Array.isArray(res)
        ? res.map((order) => normalizeOrderRecord(order))
        : [];
      setOrderData(list);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrderData([]);
    } finally {
      setLoading(false);
    }
  });

  const [deleteOrder, deleteOrderLoading] = useFetching(async (id: string) => {
    try {
      await clientAPI.deleteOrder(id);
    } catch (error) {
      console.error('Error deleting order:', error);
    }
  });

  const [deleteAllOrders, deleteAllOrdersLoading] = useFetching(async () => {
    try {
      await clientAPI.deleteAllOrders();
    } catch (error) {
      console.error('Error deleting orders:', error);
    }
  });


  useEffect(() => {
    setOrderData(liveOrders);
    setLoading(false);
  }, [liveOrders]);

  useEffect(() => {
    if (orderOpen) {
      setLoading(true);
      void fetchOrders();
    }
  }, [orderOpen, deleteOrderLoading, deleteAllOrdersLoading]);

  const handleCheckboxChange = (record: MenuCard) => {
    setSelectedRows((prev) => {
      const next = { ...prev };
      if (next[record.id]) delete next[record.id];
      else next[record.id] = true;
      return next;
    });
  };

  const columns = [
    {
      title: t('modal.basketColumn'),
      dataIndex: 'image',
      key: 'image',
      render: (_: unknown, record: MenuCard) => (
        <div
          className={`${css.imageTitleContainer} ${selectedRows[record.id] ? css.table_text : ''}`}
        >
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
      title: t('modal.priceColumn'),
      dataIndex: 'price',
      key: 'price',
      render: (_: unknown, record: MenuCard) => (
        <span className={selectedRows[record.id] ? css.table_text : ''}>
          {record.price} {t('dram')}
        </span>
      ),
    },
    {
      title: t('modal.countColumn'),
      dataIndex: 'count',
      key: 'count',
      render: (_: unknown, record: MenuCard) => (
        <div className={`${css.right_basket} ${selectedRows[record.id] ? css.table_text : ''}`}>
          <b>{t('modal.pieces', { count: record.count ?? 0 })}</b>
          <Checkbox
            checked={selectedRows[record.id]}
            onChange={() => handleCheckboxChange(record)}
          />
        </div>
      ),
    },
  ];

  const errorMessage =
    orderError instanceof Error ? orderError.message : String(orderError ?? '');

  const collapseItems: CollapseProps['items'] = orderData.map((order, orderIndex) => {
    const orderKey = order._id ?? `order-${orderIndex}`;
    const items = order.items ?? [];

    return {
      key: orderKey,
      label: t('table', { n: order?.table ?? '' }),
      children: (
        <div>
          <Table
            rowKey={(record) => menuCardRowKey(record, orderKey)}
            dataSource={items}
            columns={columns}
            className={css.table}
            pagination={false}
          />
          <div className={css.collapse}>
            <b>
              {t('modal.orderTotal', {
                price:
                  order.allPrice ||
                  items.reduce(
                    (sum, item) => sum + (Number(item.price) || 0),
                    0,
                  ),
              })}
            </b>
            <IconButton
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                void deleteOrder(order._id);
              }}
            >
              <DeleteOutlined style={{ color: 'red' }} />
            </IconButton>
          </div>
        </div>
      ),
    };
  });

  return (
    <Modal
      mask={false}
      open={orderOpen}
      onCancel={() => setOrderOpen(false)}
      footer={null}
      className={css.modal_antd}
    >
      {loading && <Spin size="large" />}
      {!loading && orderData.length === 0 && <div>{t('modal.noOrders')}</div>}
      {!loading && orderData.length > 0 && (
        <div className={css.modal}>
          <Collapse accordion items={collapseItems} />
          <div className={css.all_price}>
            <b>{t('modal.ordersTotal', { count: orderData.length })}</b>
            <IconButton type="button" onClick={() => void deleteAllOrders()}>
              {t('modal.deleteAll')}
            </IconButton>
          </div>
        </div>
      )}
      {orderError != null && <p>{t('modal.error', { message: errorMessage })}</p>}
    </Modal>
  );
}
