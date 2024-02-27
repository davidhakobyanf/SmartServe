import React, {useState, useEffect} from 'react';
import Slider from 'react-slick';
import css from './Dashboard.module.css';
import ProfileInfo from '../ProfileInfo/ProfileInfo';
import clientAPI from "../../../../api/api";
import {useProfileData} from "../../../../context/ProfileDataContext";
import img from '../../../../images/Screenshot 2024-02-20 231709.png'
import {
    ArrowUpOutlined,
    DownloadOutlined,
    MinusCircleOutlined,
    MinusOutlined,
    PlusCircleOutlined,
    PlusOutlined
} from "@ant-design/icons";
import {set} from "react-hook-form";
import AddModal from "../Modal/AddModal";
import Card from '@mui/joy/Card';
import AspectRatio from '@mui/joy/AspectRatio';
import Button from '@mui/joy/Button';
import CardContent from '@mui/joy/CardContent';
import IconButton from '@mui/joy/IconButton';
import Typography from '@mui/joy/Typography';
import {useFetching} from "../../../../hoc/fetchingHook";
import DynamicCheckbox from "../../../../hoc/DynamicCheckbox";
import Quantity from "../../../../hoc/Quantity/Quantity";
import images from '../../../../images/Screenshot 2024-02-20 231709.png'

const Dashboard = () => {
    const {profileDataList, setProfileDataList} = useProfileData();
    const [modalOpen, setModalOpen] = useState(false)
    const [quantity, setQuantity] = useState(1);
    const [images, setImages] = useState([]);
    const [fetchProfile, profileLoading, profileError] = useFetching(async () => {
        try {
            const {data: res} = await clientAPI.getProfile();
            if (res) {
                setProfileDataList(res);
                const importedImages = await Promise.all(
                    res.card.map(item => import(`../../../../images/${item.image.name}`))
                );
                setImages(importedImages);
                console.log(res, 'res')
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            profileLoading(false);
        }
    });
    const [fetchAddCard, AddCardLoading, AddCardError] = useFetching(async (formData) => {
        try {
            const { data: res } = await clientAPI.createCard(formData);
            if (res) {
                console.log(res, 'res');
                const updatedCardArray = res.card ? [...res.card, formData] : [formData];
                const updatedRes = { ...res, card: updatedCardArray };
                // Use the updatedRes object as needed (e.g., store in state or update UI)
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        }
    });
    useEffect(() => {
        fetchProfile();
    }, []);
    useEffect(() => {
        fetchProfile();
    }, [AddCardLoading]);
    const getImageSrc = (fileName) => {
        if (fileName) {
            return `../../../../images/${fileName}`;
        }
    };




    return (
        <div className={css.dashboard}>
            <div className={css.header}>
                <h2 className={css.title}>Dashboard</h2>
                <ProfileInfo/>
            </div>
            <div className={css.body}>
                {profileDataList?.card?.map((item, index) => (

                    <Card key={index} className={css.card}>
                        <div>
                            <Typography level="title-lg">{item.title}</Typography>
                            <Typography level="body-sm">
                                {item.description.length > 45 ? `${item.description.slice(0, 45)}...` : item.description}
                            </Typography>
                            <IconButton
                                aria-label={`bookmark ${item.title}`}
                                variant="plain"
                                color="neutral"
                                size="sm"
                                sx={{position: 'absolute', top: '0.875rem', right: '0.5rem'}}
                            >
                                <PlusCircleOutlined/>
                            </IconButton>
                        </div>
                        <img
                            src={images[index]?.default}
                            alt={item.title}
                            loading="lazy"
                            className={css.card_img}
                        />
                        <CardContent orientation="horizontal">
                            <div>
                                {item.sauces ? <div>Հավելումներ</div> : null}
                                {/*<DynamicCheckbox initialOptions={item.sauces}/>*/}
                                <div>
                                    <div>
                                        <Typography fontSize="lg" fontWeight="lg">
                                            {item.price} դրամ
                                        </Typography>
                                    </div>
                                    {/*<Quantity quantity={quantity} setQuantity={setQuantity}/>*/}
                                </div>

                            </div>

                        </CardContent>
                    </Card>
                ))}
                <AddModal modalOpen={modalOpen} setModalOpen={setModalOpen} fetchAddCard={fetchAddCard}/>
            </div>
            {/*<div className={css.footer}>*/}

            {/*</div>*/}
            <div className={css.scrollToTop} onClick={() => setModalOpen(true)}>
                <ArrowUpOutlined/>
            </div>
        </div>
    );
};

export default Dashboard;
