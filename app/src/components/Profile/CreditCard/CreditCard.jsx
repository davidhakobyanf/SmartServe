import React, { useState, useEffect } from 'react';
import Cards from 'react-credit-cards-2';
import 'react-credit-cards-2/dist/es/styles-compiled.css';
import { Button, Input, message } from 'antd'; // Import message from 'antd'
import css from './CreditCard.module.css';

const CreditCard = ({ onOkClick, cardDataList, setCardDataList }) => {
    const [state, setState] = useState({
        number: '',
        expiry: '',
        balance: '',
        name: '',
        focus: '',
        isDuplicateNumber: false,
    });

    useEffect(() => {
        const isDuplicate = cardDataList.some((card) => card.number === state.number);
        setState((prev) => ({ ...prev, isDuplicateNumber: isDuplicate }));
    }, [state.number, cardDataList]);
    console.log(state.name.length,'state.name.length')
    const handleSubmit = (evt) => {
        evt.preventDefault();
       if (state.number.length !== 16){
            message.error('Write at least 16 characters on the Card Number');
        }else if (state.expiry.length !== 4){
            message.error('Write at least 4 characters on the Expiry');
        }else if (!state.balance.length){
           message.error('Write at least 1 characters on the Balance');
       } else if (!state.name.length){
            message.error('Write at least 1 characters on the Name');
        }else  if (state.isDuplicateNumber) {
           // Show error message instead of submitting
           message.error('Card number already exists.');
       }
       else {
            // Proceed with the submission
            onOkClick(state);
           console.log(evt,'evt')
           console.log(state,'state')
            message.success('Card added successfully');
        }
    };


    const handleInputFocus = (evt) => {
        setState((prev) => ({ ...prev, focus: evt.target.name }));
    };

    const handleInputChange = (evt) => {
        const { name, value } = evt.target;
        let limit;

        switch (name) {
            case 'number':
                limit = 16;
                break;
            case 'expiry':
                limit = 4;
                break;
            default:
                limit = Infinity;
                break;
        }

        const limitedValue = value.slice(0, limit);
        setState((prev) => ({ ...prev, [name]: limitedValue }));
    };

    return (
        <div className={css.card_container}>
            <Cards
                number={state.number}
                expiry={state.expiry}
                name={state.name}
                focused={state.focus}
            />
            <form className={css.form} onSubmit={handleSubmit}>
                <Input
                    type="number"
                    name="number"
                    placeholder="Card Number"
                    value={state.number}
                    onChange={handleInputChange}
                    onFocus={handleInputFocus}
                    className={`${css.input} ${state.isDuplicateNumber ? css.duplicateInput : ''}`}
                />
                <Input
                    type="number"
                    name="expiry"
                    placeholder="MM/YY Expiry"
                    value={state.expiry}
                    onChange={handleInputChange}
                    onFocus={handleInputFocus}
                    className={css.input}
                />
                <Input
                    type="number"
                    name="balance"
                    placeholder="Balance"
                    value={state.balance}
                    onChange={handleInputChange}
                    onFocus={handleInputFocus}
                    className={css.input}
                />
                <Input
                    className={css.input}
                    type="text"
                    name="name"
                    placeholder="Cardholder Name"
                    value={state.name}
                    onChange={handleInputChange}
                    onFocus={handleInputFocus}
                />
                <Button type="primary" htmlType="submit">
                    Create Card
                </Button>
            </form>
        </div>
    );
};

export default CreditCard;
