import React, {useState, useEffect} from 'react';
import Slider from 'react-slick';
import css from './Dashboard.module.css';
import ProfileInfo from '../ProfileInfo/ProfileInfo';
import clientAPI from "../../../../api/api";
import {useProfileData} from "../../../../context/ProfileDataContext";
import img from '../../../../images/Screenshot 2024-02-20 231709.png'
import {
    ArrowUpOutlined, DeleteOutlined,
    DownloadOutlined, EditOutlined, LogoutOutlined,
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
import { MdOutlineLogout } from "react-icons/md";
import CardContent from '@mui/joy/CardContent';
import IconButton from '@mui/joy/IconButton';
import Typography from '@mui/joy/Typography';
import {useFetching} from "../../../../hoc/fetchingHook";
import CardModal from "../Modal/CardModal/CardModal";
import { Input, Space } from 'antd';
import {useNavigate} from "react-router-dom";
const { Search } = Input;

const Dashboard = () => {
    const {profileDataList, setProfileDataList} = useProfileData();
    const [modalOpen, setModalOpen] = useState(false)
    const [selectedItem, setSelectedItem] = useState(null);
    const [selectedItemIndex, setSelectedItemIndex] = useState(null);
    const [images, setImages] = useState([]);
    const [cardModalOpen, setCardModalOpen] = useState(false);
    const navigate = useNavigate()
    const [fetchProfile, profileLoading, profileError] = useFetching(async () => {
        try {
            const {data: res} = await clientAPI.getProfile();
            if (res) {
                setProfileDataList(res);
                if (res.card){
                    const importedImages = await Promise.all(
                        res.card.map(async (item) => {
                            const imageModule = await import(`../../../../images/${item.image.name}`);
                            return { id: item.id, default: imageModule.default };
                        })
                    );
                    setImages(importedImages);
                }

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
    console.log(images,'images')
    const modalCard = (item,index) => {
        setCardModalOpen(true)
        setSelectedItemIndex(index)
        setSelectedItem(item)
        console.log(index,'index')
        console.log(item,'item')
    }

    const logoutHandler = () => {
        // Remove 'isLoggedIn' from localStorage
        localStorage.removeItem('isLoggedIn');
        navigate("/")
        // Additional logout logic if needed
    };


    const onSearch = (value) => {
        console.log(value);
        if (value.trim() === '') {
            fetchProfile();
        } else {
            const filteredCards = profileDataList.card.filter((card) =>
                card.title.toLowerCase().includes(value.toLowerCase())
            );
            setProfileDataList({ ...profileDataList, card: filteredCards });
        }
        console.log(profileDataList, 'profileDataList');

    };

    return (
        <div className={css.dashboard}>
            <div className={css.header}>
                <ProfileInfo/>
                <div className={css.profile_search}>
                    <Search
                        placeholder="input search text"
                        onChange={(e) => onSearch(e.target.value)}
                        style={{
                            width: 200,
                        }}
                    />
                </div>
                <div className={css.logout} onClick={logoutHandler}>
                    <MdOutlineLogout />
                </div>
            </div>
            <CardModal cardModalOpen={cardModalOpen} setCardModalOpen={setCardModalOpen} index={selectedItemIndex}
                       item={selectedItem} images={images} setImages={setImages} fetchProfile={fetchProfile}/>

            <div className={css.body}>
                {profileDataList?.card?.map((item, index) => (
                    <Card key={index} className={css.card} onClick={() => modalCard(item,index)}>
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
                            src={images.find(image => image.id === item.id)?.default}
                            alt={item.title}
                            loading="lazy"
                            className={css.card_img}
                        />
                        <CardContent orientation="horizontal" className={css.content}>
                            <div>
                                {item.sauces.length > 0 ? <div>Հավելումներ</div> : null}
                                <div className={css.price}>
                                    <Typography fontSize="lg" fontWeight="lg">
                                        {item.price} դրամ
                                    </Typography>
                                </div>
                            </div>

                        </CardContent>
                    </Card>
                ))}
                <AddModal modalOpen={modalOpen} setModalOpen={setModalOpen} fetchAddCard={fetchAddCard}  />
            </div>
            {/*<div className={css.footer}>*/}

            {/*</div>*/}
            <div className={css.scrollToTop} onClick={() => setModalOpen(true)}>
                <PlusOutlined />
            </div>
        </div>
    );
};

export default Dashboard;
