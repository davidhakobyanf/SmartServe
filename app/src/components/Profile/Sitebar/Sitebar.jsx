import React from 'react';
import css from './Sitebar.module.css'
import SitebarTable from "./SitebarTable/SitebarTable";

const Sitebar = () => {
    return (
        <div className={css.sitebar}>
            {/* <ProfileInfo username={'David Hakobyan'} img={img}/> */}
            {/* logo */}
            <SitebarTable pathname={'/dashboard'}  title={'Dashboard'}/>
            <SitebarTable pathname={'/transaction'} title={'Transaction'}/>
            <SitebarTable pathname={'/statistics'}  title={'Statistics'}/>
            <SitebarTable pathname={'/wallet'}  title={'Wallet'}/>
            <SitebarTable pathname={'/'}  title={'Logout'}/>
        </div>
    );
};

export default Sitebar;