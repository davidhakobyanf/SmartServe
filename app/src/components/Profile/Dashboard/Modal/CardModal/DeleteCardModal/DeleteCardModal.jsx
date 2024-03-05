import React from 'react';
import { Modal } from "antd";
import css from './DeleteCardModal.module.css'

const DeleteCardModal = ({ title, isVisible, onOk, onCancel, okText, cancelText }) => {
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
