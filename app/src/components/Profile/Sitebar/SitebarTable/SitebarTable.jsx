import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import css from './SitebarTable.module.css';

const SitebarTable = ({ title, pathname }) => {
    const [isActive, setIsActive] = useState(false);
    const location = useLocation();

    const handleLogout = () => {
        if (pathname === '/') {
            localStorage.removeItem('isLoggedIn');
        }
    };

    // Ensure that /profile is added only once
    const toPath = pathname === '/' ? '/' : `/profile${pathname}`;

    useEffect(() => {
        // Check if the current location matches the link's path
        setIsActive(location.pathname === toPath);
    }, [location.pathname, toPath]);

    return (
        <Link to={toPath} className={`${isActive ? css.activeBorder : css.table}`} onClick={handleLogout}>
            <div className={`${css.table_title} ${isActive ? css.active_text : ''}`}>{title}</div>
        </Link>
    );
};

export default SitebarTable;
