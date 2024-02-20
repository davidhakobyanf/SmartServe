import CreditCard from "../CreditCard/CreditCard";
import { Button, Modal } from "antd";
import React, {useEffect, useState} from "react";
import css from './Modal.module.css';
import {useFetching} from "../../../hoc/fetchingHook";
import clientAPI from "../../../api/api";
import LoadingSpin from "../../../hoc/LoadingSpin";

const CustomModal = ({isModalOpen,setIsModalOpen,setCardDataList,cardDataList}) => {
    const [fetchCreditCard, CreditCardLoading, CreditCardError] = useFetching(async (formData) => {
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

    const showModal = () => {
        setIsModalOpen(true);
    };

    const handleOk = (formData) => {
        fetchCreditCard(formData);
        setIsModalOpen(false);
    };

    const handleCancel = () => {
        setIsModalOpen(false);
    };
    return (
        <>
            <Button type="primary" onClick={showModal} className={css.button}>
                Open Modal
            </Button>
            <Modal
                title="Basic Modal"
                open={isModalOpen}
                onOk={() => handleOk()}
                onCancel={handleCancel}
                className={css.modal}
                footer={null}
                width={600}
            >
                <CreditCard onOkClick={handleOk} setCardDataList={setCardDataList} cardDataList={cardDataList}/>
            </Modal>
        </>
    );
};

export default CustomModal;
