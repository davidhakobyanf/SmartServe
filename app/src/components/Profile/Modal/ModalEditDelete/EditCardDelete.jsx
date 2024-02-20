import React, {useEffect, useState} from 'react';
import css from './CardEditDelete.module.css'
import {Button, Input, message, Modal} from "antd";
import Cards from "react-credit-cards-2";
import {useFetching} from "../../../../hoc/fetchingHook";
import clientAPI from "../../../../api/api";
const EditCardDelete = ({ deleteModalOpen, setDeleteModalOpen, selectedCard,fetchProfile,profileTransaction}) => {

    const [state, setState] = useState({
        number: selectedCard ? selectedCard.number : '',
        expiry:selectedCard ?  selectedCard.expiry : '',
        balance:selectedCard ?  selectedCard.balance : '',
        name:selectedCard ? selectedCard.name : '',
        focus:selectedCard ? selectedCard.focus :  '',
        isDuplicateNumber: false,
    });
    useEffect(() => {
        setState({
            number: selectedCard ? selectedCard.number : '',
            expiry:selectedCard ?  selectedCard.expiry : '',
            balance:selectedCard ?  selectedCard.balance : '',
            name:selectedCard ? selectedCard.name : '',
            focus:selectedCard ? selectedCard.focus :  '',
            isDuplicateNumber: false,
        })
    }, [selectedCard]);
    useEffect(() => {
        fetchProfile()
    },[deleteModalOpen])

    const [editCard,editCardLoading,editCardError] = useFetching(async (card) => {
        try {
            const {data:res} = await clientAPI.editCard(card) || {};
        }catch (err){
            console.error('Error fetching profile:', err);

        }
    })
    const [deleteCard, deleteCardLoading, deleteCardError] = useFetching(async (card) => {
        try {
            const { data: res } = await clientAPI.deleteCard(card);
            if (res) {
                console.log(res, 'res');
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        }
    });



    const handleDelete = (selectedCard) => {
        if (selectedCard && selectedCard.number) {
            const hasTransactions = profileTransaction.some(acc => selectedCard.number === acc.selectedCard);
            if (hasTransactions) {
                message.error("This card has a transaction attached to it, either delete these transactions or attach them to another card");
                return;
            }
            deleteCard(selectedCard.number);
            setDeleteModalOpen(false);
            message.success('Card deleted');
        }
    };

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
            editCard(state)
            console.log(state,'state')
            // Proceed with the submission
            setDeleteModalOpen(false);
            message.success('Card saved successfully');
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
        <Modal
            title="Card Details"
            open={deleteModalOpen}
            onCancel={() => setDeleteModalOpen(false)}
            width={600}
            footer={[
                <Button type="primary" htmlType="submit" onClick={handleSubmit}> {/* Добавляем onClick, чтобы вызвать handleSubmit */}
                    Save Card
                </Button>,
                <Button key="delete" danger onClick={() => handleDelete(selectedCard)}>
                    Delete
                </Button>,
                <Button key="cancel" onClick={() => setDeleteModalOpen(false)}>
                    Cancel
                </Button>,
            ]}
        >
            <div className={css.card_container}>
                {selectedCard ? <Cards
                    number={state.number}
                    expiry={state.expiry}
                    name={state.name}
                    focused={state.focus}
                /> : null}
                <form className={css.form} onSubmit={handleSubmit}>
                    <Input
                        type="number"
                        name="number"
                        placeholder="Card Number"
                        value={state.number}
                        onChange={handleInputChange}
                        onFocus={handleInputFocus}
                        readOnly
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

                </form>
            </div>

        </Modal>
    );
};

export default EditCardDelete;