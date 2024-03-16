import React, { useEffect, useState } from 'react';
import { Modal, Spin, Table, Image, message, Collapse } from 'antd';
import { useFetching } from '../../../../hoc/fetchingHook';
import clientAPI from '../../../../api/api';
import Quantity from '../../../../hoc/Quantity/Quantity';
import css from './AdminOrderModal.module.css';
import IconButton from '@mui/joy/IconButton';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';

const { Panel } = Collapse;

const AdminOrderModal = ({ orderOpen, setOrderOpen, images }) => {
    const [orderData, setOrderData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [inputWidth, setInputWidth] = useState('100px');
    const [media, setMedia] = useState(0);
    const [fetchOrders, orderLoading, orderError] = useFetching(async () => {
        try {
            const { data: res } = await clientAPI.getOrders();
            console.log(res, 'res');
            setOrderData(res);
        } catch (error) {
            console.error('Error fetching basket:', error);
        } finally {
            setLoading(false);
        }
    });

    const [deleteOrder, deleteOrderLoading, deleteOrderError] = useFetching(async (id) => {
        try {
            const { data: res } = await clientAPI.deleteOrder(id);
            if (res) {
                console.log(res, 'res');
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        }
    });

    const [deleteAllOrders, deleteAllOrdersLoading, deleteAllOrdersError] = useFetching(async () => {
        try {
            const { data: res } = await clientAPI.deleteAllOrders();
            if (res) {
                console.log(res, 'res');
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        }
    });

    const [fetchAddOrder, AddOrderLoading, AddOrderError] = useFetching(async (card) => {
        try {
            await clientAPI.createOrder(card);
        } catch (error) {
            console.error('Error fetching profile:', error);
        }
    });

    useEffect(() => {
        if (orderOpen) {
            fetchOrders();
        }
    }, [orderOpen, deleteOrderLoading, deleteAllOrdersLoading]);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth <= 330) {
                setMedia(410);
                setInputWidth('50px');
            } else if (window.innerWidth <= 410) {
                setInputWidth('50px');
                setMedia(410);
            } else if (window.innerWidth <= 600) {
                setInputWidth('50px');
                setMedia(410);
            } else {
                setInputWidth('100px');
                setMedia(0);
            }
        };

        handleResize();

        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    const handleCancel = () => {
        setOrderOpen(false);
    };

    const handleDelete = (id) => {
        if (id) {
            deleteOrder(id);
        }
        console.log(id, 'delete_id');
    };

    const handleDeleteAll = () => {
        deleteAllOrders();
    };

    const columns = [
        {
            title: 'Զամբյուղ',
            dataIndex: 'image',
            key: 'image',
            render: (text, record) => (
                <div className={css.imageTitleContainer}>
                    <span style={{ width: '100px' }}>{record.title.length > 15 ? `${record.title.slice(0, 15)}...` : record.title}</span>
                    <Image src={images.find((image) => image.id === record.id)?.default} width={100} />
                </div>
            ),
        },
        {
            title: 'Գին',
            dataIndex: 'price',
            key: 'price',
            render: (text, record) => <span>{record.price} դրամ</span>,
        },
        {
            title: 'Քանակ',
            dataIndex: 'count',
            key: 'count',
            render: (text, record) => (
                <div className={css.right_basket}>
                    <div className={css.quantity_component}>
                        <b>{record.count} հատ</b>
                    </div>
                    <div className={css.delete_button}>
                        <IconButton variant="plain" color="neutral" size="sm" onClick={() => handleDelete(record.id)}>
                            <DeleteOutlined className={css.icons} style={{ color: 'red' }} />
                        </IconButton>
                    </div>
                </div>
            ),
        },
    ];

    return (
        <div>
            <Modal mask={false} open={orderOpen} onCancel={handleCancel} footer={null} className={css.modal_antd}>
                {loading && <Spin size="large" />}
                {!loading && orderData.length === 0 && <div>Պատվեր չկա</div>}

                {!loading && (
                    <div className={css.modal}>
                        {orderData.map((order, index) => (
                            <Collapse key={index} accordion>
                                <Panel header={`Սեղան ${order?.table}`} key={index}>
                                    <Table
                                        rowKey={(record, index) => index}
                                        dataSource={order?.items}
                                        columns={columns}
                                        className={css.table}
                                        pagination={false}
                                    />
                                    <div><b>Ընդհամենը {order.allPrice} դրամ</b></div>
                                </Panel>
                            </Collapse>
                        ))}
                        <div className={css.all_price}>
                            <div>
                                <b>Ընհամենը {orderData.length}  պատվեր </b>
                            </div>
                            <div onClick={() => handleDeleteAll()}>
                                <IconButton>Ջնջել բոլորը</IconButton>
                            </div>
                        </div>
                    </div>
                )}
                {orderError && <p>Error: {orderError.message}</p>}
            </Modal>
        </div>
    );
};

export default AdminOrderModal;
