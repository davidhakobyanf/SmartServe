'use client';

import IconButton from '@mui/joy/IconButton';
import { MinusCircleOutlined, PlusCircleOutlined } from '@ant-design/icons';
import { Input } from 'antd';
import css from './Quantity.module.css';

interface QuantityProps {
  quantity: number;
  setQuantity: (value: number) => void;
  width?: string;
}

export default function Quantity({
  quantity,
  setQuantity,
  width = '100px',
}: QuantityProps) {
  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value)) {
      setQuantity(value);
    }
  };

  return (
    <div className={css.count}>
      <IconButton onClick={() => setQuantity(quantity > 1 ? quantity - 1 : 1)}>
        <MinusCircleOutlined />
      </IconButton>
      <Input
        type="number"
        className={css.count_input}
        value={quantity}
        onChange={handleQuantityChange}
        style={{ textAlign: 'center', width }}
      />
      <IconButton onClick={() => setQuantity(quantity + 1)}>
        <PlusCircleOutlined />
      </IconButton>
    </div>
  );
}
