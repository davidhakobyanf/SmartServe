import React, { useState, useEffect } from 'react';
import Slider from 'react-slick';
import css from './Dashboard.module.css';
import ProfileInfo from '../ProfileInfo/ProfileInfo';
import clientAPI from "../../../../api/api";
import { useProfileData } from "../../../../context/ProfileDataContext";
import { ArrowUpOutlined, PlusCircleOutlined } from "@ant-design/icons";
import { set } from "react-hook-form";
import AddModal from "../Modal/AddModal";
import Card from '@mui/joy/Card';
import AspectRatio from '@mui/joy/AspectRatio';
import Button from '@mui/joy/Button';
import CardContent from '@mui/joy/CardContent';
import IconButton from '@mui/joy/IconButton';
import Typography from '@mui/joy/Typography';
import { useFetching } from "../../../../hoc/fetchingHook";

const Dashboard = () => {
    const { profileDataList, setProfileDataList } = useProfileData();
    const [modalOpen, setModalOpen] = useState(false)
    const [fetchProfile, profileLoading, profileError] = useFetching(async () => {
        try {
            const { data: res } = await clientAPI.getProfile();
            if (res) {
                setProfileDataList(res);
                console.log(res, 'res')
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            profileLoading(false);
        }
    });

    useEffect(() => {
        fetchProfile();
    }, []);

    const getImageSrc = (file) => {
        if (file && file.originFileObj && file.originFileObj.uid) {
            // Assuming the image URL can be constructed from the uid
            return `/api/getImage?uid=${file.originFileObj.uid}`;
        } else {
            return ''; // Return empty string if no valid image URL is found
        }
    };







    return (
        <div className={css.dashboard}>
            <div className={css.header}>
                <h2 className={css.title}>Dashboard</h2>
                <ProfileInfo />
            </div>
            <div className={css.body}>
                {profileDataList?.card?.map((item, index) => (
                    <Card key={index} sx={{ width: 320 }}>
                        <div>
                            <Typography level="title-lg">{item.title}</Typography>
                            <Typography level="body-sm">{item.description}</Typography>
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
                        {item.image && (
                            <AspectRatio minHeight="120px" maxHeight="200px">
                                <img
                                    src={getImageSrc(item.image)}
                                    alt={item.title}
                                    loading="lazy"
                                />

                            </AspectRatio>
                        )}
                        <CardContent orientation="horizontal">
                            <div>
                                <Typography level="body-xs">Total price:</Typography>
                                <Typography fontSize="lg" fontWeight="lg">
                                    {item.price}
                                </Typography>
                            </div>
                            <Button
                                variant="solid"
                                size="md"
                                color="primary"
                                aria-label={`Explore ${item.title}`}
                                sx={{ ml: 'auto', alignSelf: 'center', fontWeight: 600 }}
                            >
                                Explore
                            </Button>
                        </CardContent>
                    </Card>
                ))}
                <AddModal modalOpen={modalOpen} setModalOpen={setModalOpen} />
            </div>
            <div className={css.footer}>

            </div>
            <div className={css.scrollToTop} onClick={() => setModalOpen(true)}>
                <ArrowUpOutlined />
            </div>
        </div>
    );
};

export default Dashboard;
