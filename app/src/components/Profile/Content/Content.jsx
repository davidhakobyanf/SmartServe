import React from 'react';
import { Outlet } from 'react-router-dom';
import css from './Content.module.css';

const Content = () => {
    return (
        <div className={css.content}>
            <Outlet />
        </div>
    );
};


export default Content;