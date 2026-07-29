'use client';

import { useState, useEffect } from 'react';
import css from './Dashboard.module.css';
import ProfileInfo from '../ProfileInfo/ProfileInfo';
import clientAPI from '@/api/api';
import { BellOutlined, PlusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import AddModal from '../Modal/AddModal';
import Card from '@mui/joy/Card';
import { MdOutlineLogout } from 'react-icons/md';
import CardContent from '@mui/joy/CardContent';
import IconButton from '@mui/joy/IconButton';
import Typography from '@mui/joy/Typography';
import { useFetching } from '@/hoc/fetchingHook';
import CardModal from '../Modal/CardModal/CardModal';
import { Input, Switch } from 'antd';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { useProfileData } from '@/context/ProfileDataContext';
import { BiSolidNotepad } from 'react-icons/bi';
import AdminOrderModal from '../AdminOrderModal/AdminOrderModal';
import { useData } from '@/context/DataContext';
import { loadMenuImages } from '@/lib/menuImages';
import type { MenuCard, MenuImage } from '@/types';
import { useWaiterCalls } from '@/context/WaiterCallsContext';
import { Badge } from 'antd';

export default function Dashboard() {
  const t = useTranslations('dashboard');
  const { profileDataList, setProfileDataList, fetchProfile } = useProfileData();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalOrderOpen, setModalOrderOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuCard | null>(null);
  const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(null);
  const [images, setImages] = useState<MenuImage[]>([]);
  const { cardActive, setCardActive } = useData();
  const [cardModalOpen, setCardModalOpen] = useState(false);
  const router = useRouter();

  const [editCard] = useFetching(async (card: Partial<MenuCard>) => {
    try {
      await clientAPI.editCard(card);
      await fetchProfile({ force: true });
    } catch (err) {
      console.error('Error editing card:', err);
    }
  });

  const [fetchAddCard] = useFetching(async (formData: Partial<MenuCard>) => {
    try {
      await clientAPI.createCard(formData);
      await fetchProfile({ force: true });
    } catch (error) {
      console.error('Error adding card:', error);
    }
  });

  useEffect(() => {
    if (profileDataList.card.length > 0) {
      setImages(loadMenuImages(profileDataList.card));
    }
  }, [profileDataList.card]);

  useEffect(() => {
    if (Object.keys(cardActive).length !== 0) {
      void editCard(cardActive);
    }
  }, [cardActive]);

  const modalCard = (item: MenuCard, index: number) => {
    setSelectedItemIndex(index);
    setSelectedItem(item);
  };
  const { calls, dismissCall } = useWaiterCalls();

  const logoutHandler = () => {
    localStorage.removeItem('accessToken');
    router.push('/');
  };

  const onSearch = (value: string) => {
    if (value.trim() === '') {
      void fetchProfile({ force: true });
    } else {
      const filteredCards = profileDataList.card.filter((card) =>
        card.title.toLowerCase().includes(value.toLowerCase()),
      );
      setProfileDataList({ ...profileDataList, card: filteredCards });
    }
  };

  const toggleActive = (id: string) => {
    setCardActive((prevActive) => {
      const updatedCard = profileDataList.card.find((item) => item.id === id);
      if (updatedCard) {
        return { ...updatedCard, active: !updatedCard.active };
      }
      return prevActive;
    });
  };

  return (
    <div className={css.dashboard}>
      <div className={css.header}>
        <ProfileInfo />
        <div className={css.profile_search}>
          <Input
            placeholder={t('searchPlaceholder')}
            onChange={(e) => onSearch(e.target.value)}
            style={{ width: 200 }}
            allowClear
          />
        </div>
        <div className={css.logout} onClick={() => setModalOrderOpen(true)}>
          <BiSolidNotepad />
        </div>
        <div className={css.logout} onClick={logoutHandler}>
          <MdOutlineLogout />
        </div>
        <div className={css.logout}>
          <Badge count={calls.length} size="small">
            <BellOutlined onClick={() => calls.forEach((call) => dismissCall(call.id))} />
          </Badge>
        </div>
      </div>
      <CardModal
        cardModalOpen={cardModalOpen}
        setCardModalOpen={setCardModalOpen}
        index={selectedItemIndex}
        item={selectedItem}
        images={images}
        fetchProfile={fetchProfile}
      />
      <div className={css.body}>
        {profileDataList?.card?.map((item, index) => (
          <Card
            key={item.id}
            className={css.card}
            onClick={() => modalCard(item, index)}
          >
            <div onClick={() => setCardModalOpen(true)}>
              <Typography level="title-lg">
                {item?.title.length > 20
                  ? `${item?.title.slice(0, 20)}...`
                  : item?.title}
              </Typography>
              <Typography level="body-sm">
                {item.description.length > 45
                  ? `${item.description.slice(0, 45)}...`
                  : item.description}
              </Typography>
              <IconButton
                aria-label={t('bookmark', { title: item.title })}
                variant="plain"
                color="neutral"
                size="sm"
                sx={{ position: 'absolute', top: '0.875rem', right: '0.5rem' }}
              >
                <PlusCircleOutlined />
              </IconButton>
            </div>
            <img
              src={images.find((image) => image.id === item.id)?.src}
              alt={item.title}
              loading="lazy"
              className={css.card_img}
              onClick={() => setCardModalOpen(true)}
            />
            <CardContent orientation="horizontal" className={css.content}>
              <div className={css.footerLeft} onClick={() => setCardModalOpen(true)}>
                {item.sauces.length > 0 ? <div>{t('extras')}</div> : null}
                <div className={css.price}>
                  <Typography fontSize="lg" fontWeight="lg">
                    {t('price', { price: item.price })}
                  </Typography>
                </div>
              </div>
              <div className={css.footerRight}>
                <Switch
                  defaultChecked={item?.active}
                  onClick={() => toggleActive(item.id)}
                />
              </div>
            </CardContent>
          </Card>
        ))}
        <AddModal
          modalOpen={modalOpen}
          setModalOpen={setModalOpen}
          fetchAddCard={fetchAddCard}
        />
        <AdminOrderModal
          orderOpen={modalOrderOpen}
          setOrderOpen={setModalOrderOpen}
          images={images}
        />
      </div>
      <div className={css.scrollToTop} onClick={() => setModalOpen(true)}>
        <PlusOutlined />
      </div>
    </div>
  );
}
