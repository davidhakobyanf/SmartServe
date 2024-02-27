import React, {useEffect, useState} from 'react';
import {Modal,Table, Checkbox} from "antd";
import img from "../../../../../images/Screenshot 2024-02-20 231709.png";
import css from "./CardModal.module.css";
import Typography from "@mui/joy/Typography";
import Quantity from "../../../../../hoc/Quantity/Quantity";
const CardModal = ({setCardModalOpen,cardModalOpen,index,item,images, setImages}) => {
    const [quantity, setQuantity] = useState(1);
    const [allTotal, setAllTotal] = useState(0);
    const [plainOptions, setPlainOptions] = useState([]);
    const [selectedOptions, setSelectedOptions] = useState({});
    useEffect(() => {
        setAllTotal(item?.price)
    }, [item]);
    const handleCancel = () => {
        setCardModalOpen(false)
    }
    console.log(item,'item')
    console.log(index,'index')


    useEffect(() => {
        setPlainOptions(item?.sauces?.map(option => ({ option, total: 0 })));
    }, [item]);

    useEffect(() => {
        // Обновляем общий total при изменении состояния total каждого элемента
        const total = plainOptions?.reduce((acc, curr) => acc + curr.total, 0);
        setAllTotal(total);
    }, [plainOptions]);

    const handleCheckboxChange = (key, checked) => {
        setSelectedOptions(prevState => ({
            ...prevState,
            [key]: checked
        }));

        setPlainOptions(prevOptions => prevOptions?.map(option => {
            if (option.option === key) {
                return { ...option, total: checked ? 350 : 0 };
            }
            return option;
        }));
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
                width={650}
                footer={null}
                style={{fontSize:'30px'}}
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
                                    <Typography level="title-lg" className={css.card_title}>{item.title}</Typography>
                                    <Typography level="body-sm">
                                        {item.description}
                                    </Typography>
                                    <Quantity quantity={quantity} setQuantity={setQuantity}/>

                                </div>
                            </div>
                            <Table columns={columns} dataSource={data} pagination={false} />
                            <div style={{marginTop: 16}}>Ընդհանու գումար {allTotal} դրամ</div>

                        </div>


                    ) : null

                }
            </Modal>
        </div>
    );
};

export default CardModal;