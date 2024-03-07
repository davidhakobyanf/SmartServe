import React, {useEffect, useState} from 'react';
import {Modal, Table, Checkbox, Button} from "antd";
import css from "./ClientCardModal.module.css";
import Typography from "@mui/joy/Typography";
import IconButton from "@mui/joy/IconButton";
import {DeleteOutlined, EditOutlined} from "@ant-design/icons";
import Quantity from "../../../../../src/hoc/Quantity/Quantity";

const ClientCardModal = ({setCardModalOpen, cardModalOpen, index, item, images,fetchProfile}) => {
    const [quantity, setQuantity] = useState(1);
    const [allTotal, setAllTotal] = useState(item?.price);
    const [plainOptions, setPlainOptions] = useState([]);
    const [selectedOptions, setSelectedOptions] = useState({});
    const [modalWidth, setModalWidth] = useState(650); // Default width


    useEffect(() => {
        setAllTotal(item?.price * quantity);
    }, [item, quantity]);

    useEffect(() => {
        setPlainOptions(item?.sauces?.map(option => ({option, total: 0})));
    }, [item]);

    useEffect(() => {
        const total = plainOptions?.reduce((acc, curr) => acc + curr.total, 0);
        setAllTotal(item?.price * quantity + total);
    }, [plainOptions, quantity, item]);

    useEffect(() => {
        setPlainOptions(item?.sauces?.map(option => ({option, total: 0})));
        setSelectedOptions({});
        setQuantity(1);
    }, [item]);

    useEffect(() => {
        // Update modal width based on screen width
        const handleResize = () => {
            if (window.innerWidth <= 330) {
                setModalWidth(250);

            } else if (window.innerWidth <= 630) {
                setModalWidth(400);
            } else {
                setModalWidth(650);
            }
        };

        handleResize(); // Call once to set initial width

        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    const handleCancel = () => {
        setCardModalOpen(false);
    }

    const handleCheckboxChange = (key, checked) => {
        setSelectedOptions(prevState => ({
            ...prevState,
            [key]: checked
        }));

        setPlainOptions(prevOptions => prevOptions?.map(option => {
            if (option.option === key) {
                return {...option, total: checked ? 350 : 0};
            }
            return option;
        }));
    };

    const handleAddButtonClick = () => {
        console.log(item);
    };


    const columns = [
        {
            title: 'Սոուսներ',
            dataIndex: 'option',
            key: 'option',
            render: (_, record) => {
                return (
                    <Checkbox
                        checked={!!selectedOptions[record.option]}
                        onChange={(e) => handleCheckboxChange(record.option, e.target.checked)}
                    >
                        {record.option}
                    </Checkbox>
                );
            },
        },
        {
            title: 'Total',
            dataIndex: 'total',
            key: 'total',
            render: (_, record) => {
                return record.total ? record.total : 350;
            },
        }
    ];

    const data = plainOptions?.map((option, index) => ({
        key: index,
        option: option.option,
        total: option.total,
    }));

    return (
        <div>
            <Modal
                title={item?.title}
                open={cardModalOpen}
                onCancel={handleCancel}
                width={modalWidth} // Dynamic width
                footer={null}
                className={css.modal}
            >
                {
                    item ? (
                        <div className={css.container}>
                            <div className={css.container_top}>
                                <div className={css.container_right}>
                                    <img
                                        src={images[index]?.default}
                                        alt={item.title}
                                        loading="lazy"
                                        className={css.card_img}
                                    />
                                </div>

                                <div className={css.text}>
                                    <div>
                                        <Typography level="title-lg"
                                                    className={css.card_title}>{item.title}</Typography>
                                        <div className={css.descriptionContainer}>
                                            <Typography level="body-sm" className={css.card_description}>
                                                {item.description}
                                            </Typography>
                                        </div>
                                    </div>
                                    <Quantity quantity={quantity} setQuantity={setQuantity}/>
                                </div>
                            </div>
                            <Table columns={columns} dataSource={data} pagination={false}/>
                            <div className={css.modal_footer}>
                                <div style={{marginTop: 16, fontSize: "20px"}}>
                                    Ընդհանուր գումար <b>{String(allTotal)}</b> դրամ
                                </div>
                                <div className={css.card_buttons}>
                                    <Button onClick={handleAddButtonClick}>Ավելացնել</Button>
                                </div>
                            </div>

                        </div>
                    ) : null
                }
            </Modal>

        </div>
    );
};

export default ClientCardModal;
