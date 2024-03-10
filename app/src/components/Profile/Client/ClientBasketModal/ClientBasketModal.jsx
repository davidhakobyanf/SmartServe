import React, { useEffect, useState } from 'react';
import { Modal, Spin, Table, Image } from 'antd';
import css from '../ClientCardModal/ClientCardModal.module.css';
import { useFetching } from '../../../../hoc/fetchingHook';
import clientAPI from '../../../../api/api';
import img from "../../../../images/Screenshot 2024-02-20 231709.png";
import Quantity from "../../../../hoc/Quantity/Quantity";

const ClientBasketModal = ({ basketOpen, setBasketOpen, clientId, images }) => {
    const [basketData, setBasketData] = useState([]);
    const [loading, setLoading] = useState(true);

    const [fetchBasket, basketLoading, basketError] = useFetching(async () => {
        try {
            const { data: res } = await clientAPI.getBasket(clientId);
            if (res) {
                setBasketData(res[clientId] || []);
            }
        } catch (error) {
            console.error('Error fetching basket:', error);
        } finally {
            setLoading(false);
        }
    });

    useEffect(() => {
        if (basketOpen) {
            fetchBasket();
        }
    }, [basketOpen]);

    const handleCancel = () => {
        setBasketOpen(false);
    };

    const columns = [
        {
            title: 'Image',
            dataIndex: 'image',
            key: 'image',
            render: (text, item) => <Image src={images.find(image => image.id === item.id)?.default} width={100} />,
        },
        {
            title: 'Title',
            dataIndex: 'title',
            key: 'title',
            render:(text,record) => (
                record?.title.length > 15 ? `${record?.title.slice(0, 15)}...` : record?.title
)
        },
        {
            title: 'Price',
            dataIndex: 'price',
            key: 'price',
            render: (text) => <span>{text} դրամ</span>,
        },
        {
            title: 'Count',
            dataIndex: 'count',
            key: 'count',
            render: (text, record) => (
                <Quantity quantity={record.count} setQuantity={(newQuantity) => handleQuantityChange(newQuantity, record)} />
            ),
        }
    ];

    const handleQuantityChange = (newQuantity, record) => {
        const newBasketData = basketData.map(item => {
            if (item === record) {
                return { ...item, count: newQuantity };
            }
            return item;
        });
        setBasketData(newBasketData);
    };

    return (
        <div>
            <Modal
                open={basketOpen}
                onCancel={handleCancel}
                footer={null}
                className={css.modal}
            >
                {loading && <Spin size="large" />}
                {!loading && (
                    <Table
                        rowKey={(record, index) => index}
                        dataSource={basketData}
                        columns={columns}
                        className={css.table}
                        pagination={false} // Optionally, disable pagination
                    />
                )}
                {basketError && <p>Error: {basketError.message}</p>}
            </Modal>
        </div>
    );
};

export default ClientBasketModal;
