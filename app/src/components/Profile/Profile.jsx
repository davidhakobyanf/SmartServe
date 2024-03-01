import React, {useEffect} from 'react';
import css from './Profile.module.css'
import {useNavigate} from "react-router-dom";
import {useFetching} from "../../hoc/fetchingHook";
import clientAPI from "../../api/api";
import Content from "./Content/Content";

const Profile = () => {

    const navigate = useNavigate(); // Получаем функцию навигации

    useEffect(() => {
        // Проверяем, авторизован ли пользователь
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        if (!isLoggedIn) {
            // Если пользователь не авторизован, перенаправляем на главную страницу
            navigate('/');
        }
    }, [navigate]);
    return (
        <div className={css.all_page}>
            <Content />
        </div>
    );
};

export default Profile;