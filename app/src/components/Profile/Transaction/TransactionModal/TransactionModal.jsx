import React, { useEffect, useState } from 'react';
import { message, Button, Modal, Form as AntdForm, Input, Select } from 'antd';
import clientAPI from '../../../../api/api';
import css from './TransactionModal.module.css';

const TransactionModal = ({ isModalOpen, setIsModalOpen, cardNumbers, cardDataList, fetchProfile }) => {
    const [state, setState] = useState({
        transactions: '',
        date: '',
        amount: '',
        type: '',
        selectedCard: ''
    });

    const [selectedCardBalance, setSelectedCardBalance] = useState(null);

    useEffect(() => {
        if (!isModalOpen) {
            // Reset form state when modal is closed
            resetForm();
        }
    }, [isModalOpen]);

    const resetForm = () => {
        setState({
            transactions: '',
            date: '',
            amount: '',
            type: '',
            selectedCard: ''
        });
        setSelectedCardBalance(null);
    };

    const handleCardSelect = (value) => {
        const card = cardDataList.find(card => card.number === value);
        if (card) {
            setSelectedCardBalance(card.balance);
            setState(prevState => ({
                ...prevState,
                selectedCard: value
            }));
        } else {
            setSelectedCardBalance(null);
        }
    };

    const handleTypeSelect = (value) => {
        setState(prevState => ({
            ...prevState,
            type: value
        }));
    };

    const handleInputChange = (evt) => {
        const { name, value } = evt.target;
        setState(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    const handleOk = async () => {
        try {
            if (!state.transactions.length || !state.date.length || !state.amount.length || !state.selectedCard.length || !state.type.length) {
                message.error('Please fill in all fields');
            } else if (state.type === "expenses" && parseFloat(state.amount) > parseFloat(cardDataList.find(card => card.number === state.selectedCard)?.balance)) {
                message.error('Insufficient balance');
            } else {
                const response = await clientAPI.createTransaction(state);
                message.success('Transaction created successfully');
                setIsModalOpen(false);
                fetchProfile(); // Fetch profile after transaction is created
                resetForm();
            }
        } catch (error) {
            console.error('Error creating transaction:', error);
            message.error('Failed to create transaction');
        }
    };

    const handleCancel = () => {
        setIsModalOpen(false);
    };

    return (
        <>
            <Button type="primary" onClick={() => setIsModalOpen(true)} className={css.button}>
                Open Modal
            </Button>
            <Modal
                title="Create Transaction"
                visible={isModalOpen}
                onOk={handleOk}
                onCancel={handleCancel}
                width={350}
                footer={null}
            >
                <form className={css.form}>
                    <Select
                        placeholder="Select Card Number"
                        style={{ width: '100%' }}
                        onChange={handleCardSelect}
                        value={state.selectedCard}
                        options={cardNumbers ? cardNumbers.map(number => ({
                            value: number,
                            label: number,
                        })) : ''} // Empty array if cardNumbers is falsy
                    />

                    <Select
                        placeholder="Select Type"
                        style={{ width: '100%' }}
                        onChange={handleTypeSelect}
                        value={state.type}
                        options={[
                            {value: 'expenses', label: 'expenses',},
                            {value: 'income', label: 'income',},
                        ]}
                    />

                    <Input type="text" name="transactions" value={state.transactions} onChange={handleInputChange} placeholder="Transactions" />

                    <Input type="date" name="date" value={state.date} onChange={handleInputChange} placeholder="Date" />

                    <Input type="text" name="amount" value={state.amount} onChange={handleInputChange} placeholder="Amount" />

                    {selectedCardBalance !== null && (
                        <p>Balance of selected card: {selectedCardBalance}</p>
                    )}

                    <Button type="primary" onClick={handleOk}>
                        Create
                    </Button>
                </form>
            </Modal>
        </>
    );
};

export default TransactionModal;
