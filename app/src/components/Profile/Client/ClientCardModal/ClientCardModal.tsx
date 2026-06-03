'use client';

import { useEffect, useState } from 'react';
import { Modal, Table, Checkbox, Button, message } from 'antd';
import css from './ClientCardModal.module.css';
import Typography from '@mui/joy/Typography';
import Quantity from '@/hoc/Quantity/Quantity';
import { useFetching } from '@/hoc/fetchingHook';
import clientAPI from '@/api/api';
import type { MenuCard, MenuImage } from '@/types';

interface SauceOption {
  option: string;
  total: number;
}

interface ClientCardModalProps {
  clientId: string;
  setCardModalOpen: (open: boolean) => void;
  cardModalOpen: boolean;
  index: number | null;
  item: MenuCard | null;
  images: MenuImage[];
  fetchProfile: () => void;
}

export default function ClientCardModal({
  clientId,
  setCardModalOpen,
  cardModalOpen,
  index,
  item,
  images,
}: ClientCardModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [allTotal, setAllTotal] = useState(item?.price ?? 0);
  const [plainOptions, setPlainOptions] = useState<SauceOption[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, boolean>>({});
  const [modalWidth, setModalWidth] = useState(650);

  const [fetchAddCard, addCardLoading, addCardError] = useFetching(async (modifiedItem: MenuCard) => {
    try {
      await clientAPI.createBasket({
        ...modifiedItem,
        table: clientId,
        count: quantity,
      });
    } catch (err) {
      console.error('Error adding to basket:', err);
    }
  });

  useEffect(() => {
    setAllTotal((item?.price ?? 0) * quantity);
  }, [item, quantity]);

  useEffect(() => {
    setPlainOptions(item?.sauces?.map((option) => ({ option, total: 0 })) ?? []);
  }, [item]);

  useEffect(() => {
    const total = plainOptions.reduce((acc, curr) => acc + curr.total, 0);
    setAllTotal((item?.price ?? 0) * quantity + total);
  }, [plainOptions, quantity, item]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 330) setModalWidth(250);
      else if (window.innerWidth <= 630) setModalWidth(400);
      else setModalWidth(650);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const imageSrc =
    index !== null ? images[index]?.src : item ? images.find((i) => i.id === item.id)?.src : undefined;

  const handleAddButtonClick = async () => {
    if (!item) return;
    const modifiedItem: MenuCard = {
      ...item,
      sauces: Object.keys(selectedOptions).filter((key) => selectedOptions[key]),
      table: clientId,
      count: quantity,
    };
    await fetchAddCard(modifiedItem);
    if (!addCardLoading) {
      if (addCardError) message.error('Խնդիր է սերվերի հետ');
      else message.success('Հաջողությամբ ավելացվել է զամբյուղում');
    }
    setCardModalOpen(false);
  };

  const columns = [
    {
      title: 'Սոուսներ',
      dataIndex: 'option',
      key: 'option',
      render: (_: unknown, record: SauceOption) => (
        <Checkbox
          checked={!!selectedOptions[record.option]}
          onChange={(e) => {
            const checked = e.target.checked;
            setSelectedOptions((prev) => ({ ...prev, [record.option]: checked }));
            setPlainOptions((prev) =>
              prev.map((o) =>
                o.option === record.option ? { ...o, total: checked ? 350 : 0 } : o,
              ),
            );
          }}
        >
          {record.option}
        </Checkbox>
      ),
    },
    {
      title: 'Total',
      dataIndex: 'total',
      key: 'total',
      render: (_: unknown, record: SauceOption) => (record.total ? record.total : 350),
    },
  ];

  const data = plainOptions.map((option, i) => ({
    key: i,
    option: option.option,
    total: option.total,
  }));

  return (
    <Modal
      title={
        item && item.title.length > 20 ? `${item.title.slice(0, 20)}...` : item?.title
      }
      open={cardModalOpen}
      onCancel={() => setCardModalOpen(false)}
      width={modalWidth}
      footer={null}
      className={css.modal}
    >
      {item ? (
        <div className={css.container}>
          <div className={css.container_top}>
            <img src={imageSrc} alt={item.title} loading="lazy" className={css.card_img} />
            <div className={css.text}>
              <Typography level="title-lg">{item.title}</Typography>
              <Typography level="body-sm">{item.description}</Typography>
              <Quantity quantity={quantity} setQuantity={setQuantity} />
            </div>
          </div>
          <Table columns={columns} dataSource={data} pagination={false} />
          <div className={css.modal_footer}>
            <div style={{ marginTop: 16, fontSize: '20px' }}>
              Ընդհանուր գումար <b>{String(allTotal)}</b> դրամ
            </div>
            <Button onClick={() => void handleAddButtonClick()}>Ավելացնել</Button>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}
