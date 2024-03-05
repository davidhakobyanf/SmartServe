import React, { useEffect } from 'react';
import { Modal } from "antd";
import css from './DeleteCardModal.module.css';
import clientAPI from "../../../../../../api/api";
import { useFetching } from "../../../../../../hoc/fetchingHook";

const DeleteCardModal = ({ title,isVisible,  onCancel, okText, cancelText, fetchProfile, setShowDeleteConfirmation, card,setCardModalOpen}) => {
    const [deleteCard, deleteCardLoading, deleteCardError] = useFetching(async (id) => {
        try {
            const { data: res } = await clientAPI.deleteCard(id);
            if (res) {
                console.log(res, 'res');
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        }
    });

    const handleDelete = (card) => {
        if (card) {
            console.log(card.id, 'itemcardid');
            deleteCard(card.id);
            setShowDeleteConfirmation(false);
            setCardModalOpen(false);
        }
    };

    const onOk = () => {
        handleDelete(card);
    };

    useEffect(() => {
        fetchProfile();
    }, [deleteCardLoading]);

    return (
        <Modal
            title={title}
            open={isVisible}
            onOk={onOk}
            onCancel={onCancel}
            style={{ padding: "5px" }}
            okText={okText}
            cancelText={cancelText}
        />
    );
};

export default DeleteCardModal;
