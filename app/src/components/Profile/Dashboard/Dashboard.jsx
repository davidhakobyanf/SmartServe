import React, { useState, useEffect } from 'react';
import Slider from 'react-slick';
import css from './Dashboard.module.css';
import ProfileInfo from './ProfileInfo/ProfileInfo';
import clientAPI from "../../../api/api";
import { Chart } from "react-google-charts";
import { useProfileData } from "../../../context/ProfileDataContext";
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
