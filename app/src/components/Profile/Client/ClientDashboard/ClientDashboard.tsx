'use client';

import React, { useState, useEffect } from 'react';
import css from './ClientDashboard.module.css';
import { useProfileData } from '@/context/ProfileDataContext';
import { PlusCircleOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import Card from '@mui/joy/Card';
import CardContent from '@mui/joy/CardContent';
import IconButton from '@mui/joy/IconButton';
import Typography from '@mui/joy/Typography';
import { Input, message } from 'antd';
import { useParams } from 'next/navigation';
import ClientCardModal from '../ClientCardModal/ClientCardModal';
import ClientBasketModal from '../ClientBasketModal/ClientBasketModal';
import { loadMenuImages } from '@/lib/menuImages';
import type { MenuCard, MenuImage } from '@/types';

const logo = '/images/logo.jpg';

export default function ClientDashboard() {
  const params = useParams();
  const clientId = params?.clientId as string;

  const success = () => message.success('Շատ լավ, սպասեք մատուցողին:');
  const { profileDataList, setProfileDataList, fetchProfile } = useProfileData();
  const [basketOpen, setBasketOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuCard | null>(null);
  const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(null);
  const [images, setImages] = useState<MenuImage[]>([]);
  const [cardModalOpen, setCardModalOpen] = useState(false);
  
  useEffect(() => {
    if (profileDataList.card.length > 0) {
      setImages(loadMenuImages(profileDataList.card));
    }
  }, [profileDataList.card]);
  
  console.log(selectedItem,'selectedItem')
  const modalCard = (item: MenuCard, index: number) => {
    setSelectedItemIndex(index);
    setSelectedItem(item);
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

  return (
    <div className={css.dashboard}>
      <div className={css.header}>
        <div className={css.left_header}>
          <img src={logo} className={css.logo} alt="Logo" />
        </div>
        <div className={css.profile_search}>
          <Input
            placeholder="input search text"
            onChange={(e) => onSearch(e.target.value)}
            style={{ width: 200 }}
            allowClear
          />
        </div>
        <div className={css.basket} onClick={() => setBasketOpen(true)}>
          <ShoppingCartOutlined />
        </div>
      </div>
      <ClientCardModal
        clientId={clientId}
        cardModalOpen={cardModalOpen}
        setCardModalOpen={setCardModalOpen}
        index={selectedItemIndex}
        item={
          selectedItem
            ? profileDataList.card.find((card) => card.id === selectedItem.id) ?? null
            : null
        }
        images={images}
      />
      <div className={css.body}>
        {profileDataList?.card?.map((item, index) => (
          <Card
            key={item.id}
            className={`${css.card} ${!item?.active ? css.card_unactive : ''}`}
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
                aria-label={`bookmark ${item.title}`}
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
                {item.sauces.length > 0 ? <div>Հավելումներ</div> : null}
                <div className={css.price}>
                  <Typography fontSize="lg" fontWeight="lg">
                    {item.price} դրամ
                  </Typography>
                </div>
              </div>
              <div className={css.footerRight} onClick={() => setCardModalOpen(true)} />
            </CardContent>
          </Card>
        ))}
        <ClientBasketModal
          basketOpen={basketOpen}
          setBasketOpen={setBasketOpen}
          clientId={clientId}
          images={images}
        />
      </div>
      <div className={css.scrollToTop} onClick={success}>
        Կանչել մատուցողին
      </div>
    </div>
  );
}
