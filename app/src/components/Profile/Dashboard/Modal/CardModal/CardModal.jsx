import React, {useState} from 'react';
import {Modal} from "antd";
import img from "../../../../../images/Screenshot 2024-02-20 231709.png";
import css from "./CardModal.module.css";
import Typography from "@mui/joy/Typography";
import Quantity from "../../../../../hoc/Quantity/Quantity";
import DynamicCheckbox from '../../../../../hoc/DynamicCheckbox';
const CardModal = ({setCardModalOpen,cardModalOpen,index,item,images, setImages}) => {
    const [quantity, setQuantity] = useState(1);

    const handleCancel = () => {
        setCardModalOpen(false)
    }
    console.log(item,'item')
    console.log(index,'index')
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
                            <DynamicCheckbox initialOptions={item.sauces}/>
                        </div>


                    ) : null

                }
            </Modal>
        </div>
    );
};

export default CardModal;