import React, {useEffect, useState} from 'react';
import css from "../ClientCardModal/ClientCardModal.module.css";
import {Modal} from "antd";
import {useFetching} from "../../../../hoc/fetchingHook";
import clientAPI from "../../../../api/api";

const ClientBasketModal = ({basketOpen, setBasketOpen}) => {
    const [userData, setUserData] = useState({});
    const [loading, setLoading] = useState(true);

    const [fetchBasket, basketLoading, basketError] = useFetching(async () => {
        try {
            const { data: res } = await clientAPI.getBasket();
            if (res) {
                setUserData(res);
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setLoading(false);
        }
    });
    useEffect(() => {
        fetchBasket()
    }, []);
    const handleCancel = () => {
        setBasketOpen(false)
    }
    console.log(userData,'userData')
    return (
        <div>
            <Modal
                open={basketOpen}
                onCancel={handleCancel}
                footer={null}
                className={css.modal}
            >

            </Modal>
        </div>
    );
};

export default ClientBasketModal;