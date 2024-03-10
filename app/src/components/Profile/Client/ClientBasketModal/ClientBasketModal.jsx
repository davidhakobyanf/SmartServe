import React, {useEffect, useState} from 'react';
import {Modal, Spin, Table, Image} from 'antd';
import {useFetching} from '../../../../hoc/fetchingHook';
import clientAPI from '../../../../api/api';
import Quantity from "../../../../hoc/Quantity/Quantity";
import css from './ClientBasketModal.module.css'

const ClientBasketModal = ({basketOpen, setBasketOpen, clientId, images}) => {
    const [basketData, setBasketData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [inputWidth, setInputWidth] = useState("100px")
    const [media, setMedia] = useState(0)
    const [fetchBasket, basketLoading, basketError] = useFetching(async () => {
        try {
            const {data: res} = await clientAPI.getBasket(clientId);
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
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth <= 330) {
                setMedia(410)
                setInputWidth("50px");
            }        else if (window.innerWidth <= 410) {
                setInputWidth("50px");
                setMedia(410)
            }else {
                setInputWidth("100px");
            }
        };

        handleResize(); // Call once to set initial width

        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    const handleCancel = () => {
        setBasketOpen(false);
    };
    const  columns = [
        {
            title: 'Image & Title',
            dataIndex: 'image',
            key: 'image',
            render: (text, record) => (
                <div className={css.imageTitleContainer}>
                    <span style={{ width: '100px' }}>
                        {record.title.length > 15 ? `${record.title.slice(0, 15)}...` : record.title}
                    </span>
                    <Image src={images.find((image) => image.id === record.id)?.default} width={100} />
                </div>
            ),
        },
        {
            title: 'Price',
            dataIndex: 'price',
            key: 'price',
            render: (text, record) => <span>{text * record.count} դրամ</span>,
        },
        {
            title: 'Count',
            dataIndex: 'count',
            key: 'count',
            render: (text, record) => (
                <Quantity
                    width={inputWidth}
                    quantity={record.count}
                    setQuantity={(newQuantity) => handleQuantityChange(newQuantity, record)}
                />
            ),
        },
    ]
    const columnsmid = [
        {
            title: 'Image & Title',
            dataIndex: 'image',
            key: 'image',
            render: (text, record) => (
                <div className={css.imageTitleContainer}>
                    <span style={{ width: '100px' }}>
                        {record.title.length > 15 ? `${record.title.slice(0, 15)}...` : record.title}
                    </span>
                    <Image src={images.find((image) => image.id === record.id)?.default} width={100} />
                </div>
            ),
        },
        {
                dataIndex: 'price',
                key: 'price',
                render: (text, record) => (
                    <div className={css.price_count}>
                        <Quantity
                            width={inputWidth}
                            quantity={record.count}
                            setQuantity={(newQuantity) => handleQuantityChange(newQuantity, record)}
                        />
                        <span>{text * record.count} դրամ</span>
                    </div>
                ),
        }
    ];

    const handleQuantityChange = (newQuantity, record) => {
        const newBasketData = basketData.map(item => {
            if (item === record) {
                return {...item, count: newQuantity};
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
                {loading && <Spin size="large"/>}
                {!loading && (
                    <Table
                        rowKey={(record, index) => index}
                        dataSource={basketData}
                        columns={media === 410 ? columnsmid :   columns}
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
