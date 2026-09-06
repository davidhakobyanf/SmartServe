'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Modal, Table, Checkbox } from 'antd';
import css from './CardModal.module.css';
import Typography from '@mui/joy/Typography';
import IconButton from '@mui/joy/IconButton';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import DeleteCardModal from './DeleteCardModal/DeleteCardModal';
import EditCardModal from './EditCardModal/EditCardModal';
import Quantity from '@/hoc/Quantity/Quantity';
import type { MenuCard, MenuImage, MenuSauce } from '@/types';

interface SauceOption {
  option: MenuSauce;
  total: number;
}

interface CardModalProps {
  setCardModalOpen: (open: boolean) => void;
  cardModalOpen: boolean;
  index: number | null;
  item: MenuCard | null;
  images: MenuImage[];
  fetchProfile: (options?: { force?: boolean }) => void;
}

export default function CardModal({
  setCardModalOpen,
  cardModalOpen,
  index,
  item,
  images,
  fetchProfile,
}: CardModalProps) {
  const t = useTranslations('menuModal');
  const [quantity, setQuantity] = useState(1);
  const [allTotal, setAllTotal] = useState(item?.price ?? 0);
  const [plainOptions, setPlainOptions] = useState<SauceOption[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, boolean>>({});
  const [modalWidth, setModalWidth] = useState(650);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [showEditConfirmation, setShowEditConfirmation] = useState(false);

  useEffect(() => {
    setAllTotal((item?.price ?? 0) * quantity);
  }, [item, quantity]);

  useEffect(() => {
    setPlainOptions(item?.sauces?.map((option) => ({ option, total: 0 })) ?? []);
  }, [item]);

  useEffect(() => {
    const total = plainOptions?.reduce((acc, curr) => acc + curr.total, 0) ?? 0;
    setAllTotal(((item?.price ?? 0) + total) * quantity);
  }, [plainOptions, quantity, item]);

  useEffect(() => {
    setPlainOptions(item?.sauces?.map((option) => ({ option, total: 0 })) ?? []);
    setSelectedOptions({});
    setQuantity(1);
  }, [item]);

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

  const columns = [
    {
      title: t('card.saucesColumn'),
      dataIndex: 'option',
      key: 'option',
      render: (_: unknown, record: SauceOption) => (
        <Checkbox
          checked={!!selectedOptions[record.option.id]}
          onChange={(e) => {
            const checked = e.target.checked;
            setSelectedOptions((prev) => ({
              ...prev,
              [record.option.id]: checked,
            }));
            setPlainOptions((prev) =>
              prev.map((o) =>
                o.option.id === record.option.id
                  ? { ...o, total: checked ? record.option.price : 0 }
                  : o,
              ),
            );
          }}
        >
          {record.option.name}
        </Checkbox>
      ),
    },
    {
      title: t('card.totalColumn'),
      dataIndex: 'total',
      key: 'total',
      render: (_: unknown, record: SauceOption) => record.option.price,
    },
  ];

  const data = plainOptions?.map((option) => ({
    key: option.option.id,
    option: option.option,
    total: option.total,
  }));

  return (
    <div>
      <Modal
        title={
          item && item.title.length > 20
            ? `${item.title.slice(0, 20)}...`
            : item?.title
        }
        open={cardModalOpen}
        onCancel={() => setCardModalOpen(false)}
        width={modalWidth}
        footer={null}
        className={css.modal}
        classNames={{ body: css.modalBody }}
      >
        {item ? (
          <div className={css.container}>
            <div className={css.container_top}>
              <div className={css.container_right}>
                <img src={imageSrc} alt={item.title} loading="lazy" className={css.card_img} />
              </div>
              <div className={css.text}>
                <Typography level="title-lg" className={css.card_title}>
                  {item.title}
                </Typography>
                <Typography level="body-sm" className={css.card_description}>
                  {item.description}
                </Typography>
                <Quantity quantity={quantity} setQuantity={setQuantity} />
              </div>
            </div>
            <Table columns={columns} dataSource={data} pagination={false} />
            <div className={css.modal_footer}>
              <div style={{ marginTop: 16, fontSize: '20px' }}>
                {t.rich('card.totalAmount', {
                  total: String(allTotal),
                  b: (chunks) => <b>{chunks}</b>,
                })}
              </div>
              <div className={css.card_buttons}>
                <IconButton variant="plain" color="neutral" size="sm">
                  <EditOutlined
                    className={css.icons}
                    style={{ color: 'blue' }}
                    onClick={() => setShowEditConfirmation(true)}
                  />
                </IconButton>
                <IconButton
                  variant="plain"
                  color="neutral"
                  size="sm"
                  onClick={() => setShowDeleteConfirmation(true)}
                >
                  <DeleteOutlined className={css.icons} style={{ color: 'red' }} />
                </IconButton>
              </div>
            </div>
          </div>
        ) : null}
      </Modal>
      <EditCardModal
        item={item}
        fetchProfile={fetchProfile}
        showEditConfirmation={showEditConfirmation}
        setShowEditConfirmation={setShowEditConfirmation}
        setCardModalOpen={setCardModalOpen}
      />
      <DeleteCardModal
        fetchProfile={fetchProfile}
        title={t('card.deleteConfirm', { title: item?.title ?? '' })}
        isVisible={showDeleteConfirmation}
        onCancel={() => setShowDeleteConfirmation(false)}
        setShowDeleteConfirmation={setShowDeleteConfirmation}
        okText={t('card.deleteOk')}
        cancelText={t('card.deleteCancel')}
        card={item}
        setCardModalOpen={setCardModalOpen}
      />
    </div>
  );
}
