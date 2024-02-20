import React, {useEffect} from 'react';
import css from './Profile.module.css'
import Sitebar from "./Sitebar/Sitebar";
import {useNavigate} from "react-router-dom";
import {useFetching} from "../../hoc/fetchingHook";
import clientAPI from "../../api/api";
import Content from "./Content/Content";

const Profile = () => {
    const navigate = useNavigate();

    useEffect(() => {
        // Check if 'isLoggedIn' is true in localStorage
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        if (!isLoggedIn) {
            navigate('/');
        }
    }, [navigate]);
    return (
        <div className={css.all_page}>
            <Sitebar />
            <Content />
        </div>
    );
};

export default Profile;