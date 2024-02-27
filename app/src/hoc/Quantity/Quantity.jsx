import React, { useEffect } from 'react';
import IconButton from "@mui/joy/IconButton";
import {MinusCircleOutlined, PlusCircleOutlined} from "@ant-design/icons";
import {Input} from "antd";
import css from './Quantity.module.css'
const Quantity = ({ quantity, setQuantity }) => {
    const handleQuantityChange = (e) => {
        const value = parseInt(e.target.value);
        if (!isNaN(value)) {
            setQuantity(value);
        }
    };


    return (
        <div className={css.count}>
            <IconButton   onClick={() => setQuantity(quantity > 1 ? quantity - 1 : 1)}>
                <MinusCircleOutlined />
            </IconButton>
            <Input
                type='number'
                className={css.count_input}
                value={quantity}
                onChange={handleQuantityChange}
                style={{textAlign: 'center'}}
            />
            <IconButton  onClick={() => setQuantity(quantity + 1)}>
                <PlusCircleOutlined />
            </IconButton>


        </div>
    );
};

export default Quantity;
