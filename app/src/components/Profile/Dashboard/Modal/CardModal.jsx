import React from 'react';
import {Modal} from "antd";

const CardModal = ({setCardModalOpen,cardModalOpen}) => {

    const handleCancel = () => {
        setCardModalOpen(false)
    }
    return (
        <div>
            <Modal
                title="Create Card"
                open={cardModalOpen}
                onCancel={handleCancel}
                width={350}
                footer={null}
            >
                sadas
            </Modal>
        </div>
    );
};

export default CardModal;