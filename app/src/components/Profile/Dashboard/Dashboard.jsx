import React, { useState, useEffect } from 'react';
import Slider from 'react-slick';
import css from './Dashboard.module.css';
import ProfileInfo from './ProfileInfo/ProfileInfo';
import { Button } from 'antd';
import Cards from 'react-credit-cards-2';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import { useFetching } from "../../../hoc/fetchingHook";
import clientAPI from "../../../api/api";
import LoadingSpin from "../../../hoc/LoadingSpin";
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Scrollbar, A11y } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { Chart } from "react-google-charts";
import { useProfileData } from "../../../context/ProfileDataContext";
import Table from "antd/lib/table";
import {CaretDownOutlined, CaretUpOutlined, DeleteOutlined, EditOutlined} from "@ant-design/icons";

const Dashboard = () => {
    const { profileDataList, setProfileDataList } = useProfileData();



    const fetchProfile = async () => {
        try {
            const { data: res } = await clientAPI.getProfile();
            if (res) {
                setProfileDataList(res);
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);









    return (
        <div className={css.dashboard}>
            <div className={css.header}>
                <h2 className={css.title}>Dashboard</h2>
                <ProfileInfo/>
            </div>
            <div className={css.body}>

            </div>
            <div className={css.footer}>
            </div>
        </div>
    );
};

export default Dashboard;
