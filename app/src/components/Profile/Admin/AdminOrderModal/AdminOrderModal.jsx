import React, { useEffect, useState } from 'react';
import {Modal, Spin, Table, Image, message, Collapse, Checkbox} from 'antd';
import { useFetching } from '../../../../hoc/fetchingHook';
import clientAPI from '../../../../api/api';
import Quantity from '../../../../hoc/Quantity/Quantity';
import css from './AdminOrderModal.module.css';
import IconButton from '@mui/joy/IconButton';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import {useData} from "../../../../context/DataContext";

const { Panel } = Collapse;

const AdminOrderModal = ({ orderOpen, setOrderOpen, images }) => {
    const [orderData, setOrderData] = useState([]);
    const [selectedRows, setSelectedRows] = useState({});
    const [loading, setLoading] = useState(true);
    const [inputWidth, setInputWidth] = useState('100px');
    const [media, setMedia] = useState(0);
    const [checked, setChecked] = useState(false);
    const {orderIsLoading, setOrderIsLoading} = useData()
    const [fetchOrders, orderLoading, orderError] = useFetching(async () => {
        try {
            const { data: res } = await clientAPI.getOrders();
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
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        }
    });

    const [deleteAllOrders, deleteAllOrdersLoading, deleteAllOrdersError] = useFetching(async () => {
        try {
            const { data: res } = await clientAPI.deleteAllOrders();
            if (res) {
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        }
    });

    console.log(orderIsLoading,'orderIsLoading')
    useEffect(() => {
            fetchOrders()
    }, [orderOpen, deleteOrderLoading, deleteAllOrdersLoading,orderIsLoading]);
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
    const handleCheckboxChange = (record) => {
        if (selectedRows[record.id]) {
            const updatedRows = { ...selectedRows };
            delete updatedRows[record.id];
            setSelectedRows(updatedRows);
        } else {
            setSelectedRows({ ...selectedRows, [record.id]: true });
        }
    };


    const handleDelete = (id) => {
        if (id) {
            deleteOrder(id);
        }
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
                <div className={`${css.imageTitleContainer} ${selectedRows[record.id] && css.table_text}`}>
                    <span style={{width: '100px' }}>{record.title.length > 15 ? `${record.title.slice(0, 15)}...` : record.title}</span>
                    <Image src={images.find((image) => image.id === record.id)?.default} width={100} />
                </div>
            ),
        },
        {
            title: 'Գին',
            dataIndex: 'price',
            key: 'price',
            render: (text, record) => <span
                className={`${selectedRows[record.id] && css.table_text}`}>{record.price} դրամ</span>
            ,
        },
        {
            title: 'Քանակ',
            dataIndex: 'count',
            key: 'count',
            render: (text, record) => (
                <div className={`${css.right_basket} ${selectedRows[record.id] && css.table_text}`}>
                    <div className={css.quantity_component}>
                        <b>{record.count} հատ</b>
                    </div>
                    <div className={css.delete_button}>
                        <IconButton variant="plain" color="neutral" size="sm" onClick={() => handleCheckboxChange(record)}>
                            <Checkbox checked={selectedRows[record.id]} onChange={() => handleCheckboxChange(record)} />
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
                                    <div className={css.collapse}>
                                        <div><b>Ընդհամենը {order.allPrice} դրամ</b></div>
                                        <IconButton variant="plain" color="neutral" size="sm" onClick={() => handleDelete(order?._id)}>
                                            <DeleteOutlined className={css.icons} style={{color: 'red'}} />
                                        </IconButton>

                                    </div>
                                </Panel>
                            </Collapse>
                        ))}
                        <div className={css.all_price}>
                            <div>
                                <b>Ընհամենը {orderData.length} պատվեր </b>
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
