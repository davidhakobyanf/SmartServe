import React, {useEffect, useState} from 'react';
import {Modal, Spin, Table, Image, message} from 'antd';
import {useFetching} from '../../../../hoc/fetchingHook';
import clientAPI from '../../../../api/api';
import Quantity from "../../../../hoc/Quantity/Quantity";
import css from './ClientBasketModal.module.css'
import IconButton from "@mui/joy/IconButton";
import {DeleteOutlined, EditOutlined} from "@ant-design/icons";

const ClientBasketModal = ({basketOpen, setBasketOpen, clientId, images}) => {
    const [basketData, setBasketData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [inputWidth, setInputWidth] = useState("100px")
    const [media, setMedia] = useState(0)
    const [fetchBasket, basketLoading, basketError] = useFetching(async () => {
        try {
            const {data: res} = await clientAPI.getBasket(clientId);
            if (res,clientId) {
                setBasketData(res[clientId] || []);
            }
        } catch (error) {
            console.error('Error fetching basket:', error);
        } finally {
            setLoading(false);
        }
    });
    const [deleteBasket, deleteBasketLoading, deleteBasketError] = useFetching(async (id,table) => {
        try {
            const { data: res } = await clientAPI.deleteBasket(id,table);
            if (res) {
                console.log(res, 'res');
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        }
    });
    const [deleteAllBasket, deleteAllBasketLoading, deleteAllBasketError] = useFetching(async (table) => {
        try {
            const { data: res } = await clientAPI.deleteAllBasket(table);
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
    const totalPrice = basketData.reduce((total, item) => total + (item.price * item.count + (350 * (item.sauces.length === 0 ? 0 : item.sauces.length))), 0);
    const success = () => {
        message.success('Ձեր  պատվերը ընդունված է:');
    };
    useEffect(() => {
        if (basketOpen) {
            fetchBasket();
        }
    }, [clientId,basketOpen,deleteBasketLoading,deleteAllBasketLoading]);
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth <= 330) {
                setMedia(410)
                setInputWidth("50px");
            }        else if (window.innerWidth <= 410) {
                setInputWidth("50px");
                setMedia(410)
            }else if (window.innerWidth <= 600){
                setInputWidth("50px");
                setMedia(410)
            }
            else {
                setInputWidth("100px");
                setMedia(0)
            }
        };

        handleResize();

        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    const handleCancel = () => {
        setBasketOpen(false);
    };
    const handleDelete = (id,clientId) => {
        if (clientId){
            deleteBasket(id,clientId)
        }
        console.log(id,'delete_id')
        console.log(clientId,'clientId')
    }
    const handleDeleteAll = (clientId) => {
        if (clientId){
            deleteAllBasket(clientId)
        }
        console.log(clientId,'clientId')
    }
    const handleOrder = () => {
        const updatedBasketData = basketData.map(item => {
            const itemTotalPrice = item.price * item.count + (350 * (item.sauces.length === 0 ? 0 : item.sauces.length))
            return {
                ...item,
                price: itemTotalPrice
            };
        });
        const totalPrice = updatedBasketData.reduce((total, item) => total + item.price, 0);
        const updatedBasketDataWithTotal = {
            items: updatedBasketData,
            allPrice: totalPrice,
            table:clientId
        };
        fetchAddOrder(updatedBasketDataWithTotal)
        success();
        console.log("All basket data:", updatedBasketDataWithTotal);
    };



    const  columns = [
        {
            title:'Զամբյուղ',
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
            title: 'Գին',
            dataIndex: 'price',
            key: 'price',
            render: (text, record) => <span>{text * record.count + (350 * (record.sauces.length === 0 ? 0 : record.sauces.length)) } դրամ</span>,
        },
        {
            title: 'Քանակ',
            dataIndex: 'count',
            key: 'count',
            render: (text, record) => (
                <div className={css.right_basket}>
                    <div className={css.quantity_component}>
                        <Quantity
                            width={inputWidth}
                            quantity={record.count}
                            setQuantity={(newQuantity) => handleQuantityChange(newQuantity, record)}
                        />
                    </div>

                    <div className={css.delete_button}>
                        <IconButton
                            variant="plain"
                            color="neutral"
                            size="sm"
                            onClick={() => handleDelete(record.id,clientId)}
                        >
                            <DeleteOutlined   className={css.icons} style={{color: "red"}}/>
                        </IconButton>
                    </div>
                </div>

            ),
        },
    ]
    const columnsmid = [
        {
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
                        <div className={css.delete_button}>
                            <IconButton
                                variant="plain"
                                color="neutral"
                                size="sm"
                            >
                                <DeleteOutlined className={css.icons} style={{color: "red"}}/>
                            </IconButton>
                        </div>

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
                mask={false}
                open={basketOpen}
                onCancel={handleCancel}
                footer={null}
                className={css.modal_antd}
            >
                {loading && <Spin size="large"/>}
                {!loading && (
                    <div >
                        <div className={css.modal}>
                            <Table
                                rowKey={(record, index) => index}
                                dataSource={basketData}
                                columns={media === 410 ? columnsmid :   columns}
                                className={css.table}
                                pagination={false} // Optionally, disable pagination
                            />
                        </div>

                        <div className={css.all_price}>
                            <div>
                                <b>Ընհամենը {totalPrice} դրամ </b>
                            </div>
                            <div onClick={handleOrder}>
                                <IconButton>
                                    Պատվիրել
                                </IconButton>
                            </div>
                            <div onClick={() => handleDeleteAll(clientId)}>
                                <IconButton>
                                    Ջնջել բոլորը
                                </IconButton>
                            </div>

                        </div>

                    </div>

                )}
                {basketError && <p>Error: {basketError.message}</p>}
            </Modal>
        </div>
    );
};

export default ClientBasketModal;
