import React, { useEffect, useState } from 'react';
import css from './Transaction.module.css';
import Search from 'antd/es/input/Search';
import Table from 'antd/lib/table';
import { useFetching } from '../../../hoc/fetchingHook';
import clientAPI from "../../../api/api";
import TransactionModal from '../Transaction/TransactionModal/TransactionModal'
import {EditOutlined, DeleteOutlined, CaretDownOutlined, CaretUpOutlined} from '@ant-design/icons';
import {Button, Input, message, Modal, Select} from "antd";
import {useCardData} from "../../../context/CardDataContext";
import LoadingSpin from "../../../hoc/LoadingSpin";
import {useProfileData} from "../../../context/ProfileDataContext";

const Transaction = () => {
    const [cardNumbers, setCardNumbers] = useState([]);
    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isModalEditOpen, setIsModalEditOpen] = useState(false)
    const [isModalDeleteOpen, setIsModalDeleteOpen] = useState(false)
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const { cardDataList, setCardDataList } = useCardData();
    const { profileDataList, setProfileDataList, profileTransaction, setProfileTransaction } = useProfileData();
    const [state, setState] = useState({
        transactions: selectedTransaction ? selectedTransaction.transactions : '',
        date: selectedTransaction ? selectedTransaction.date : '',
        amount:selectedTransaction ? selectedTransaction.amount : '',
        selectedCard:selectedTransaction ? selectedTransaction.selectedCard : '',
        type:selectedTransaction ? selectedTransaction.type : '',
        key: selectedTransaction ? selectedTransaction.key : ''
    });
    const [fetchProfile, profileLoading, profileError] = useFetching(async () => {
        try {
            const { data: res } = await clientAPI.getProfile();
            if (res) {
                setCardDataList(res.card);
                setProfileDataList(res)
                setProfileTransaction(res.transaction)
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        }
    });
    const [fetchDeleteTransaction, DeleteTransactionLoading, DeleteTransactionError] = useFetching(async (transactionKey) => {
        try {
            const {data: res} = await clientAPI.deleteTransaction(transactionKey);
            if (res){
                console.log(res,'res')
            }
        }catch (error){
            console.error('Error fetching profile:', error);
        }
    })
    const [fetchEditTransaction, isLoadingEditTransaction, errorEditTransaction] = useFetching(async (transaction) => {
        try {
            const {data:res} = await clientAPI.editTransaction(transaction)|| {};
            if (res){
                console.log(res,'res')
            }
        }catch (err){
            console.error('Error fetching profile:', err);
        }
    })
    const onSearch = (value, _e, info) => console.log(info?.source, value);
    const pageSize = 8;
    useEffect(() => {
        if (!isLoadingEditTransaction && !DeleteTransactionLoading) {
            fetchProfile();
        }
    }, [isLoadingEditTransaction, DeleteTransactionLoading,isModalOpen]);

    useEffect(() => {
        if (cardDataList){
            setCardNumbers(cardDataList.map(card => card.number));
        }
    }, [cardDataList]);
    useEffect(() => {
        setState({
            transactions: selectedTransaction ? selectedTransaction.transactions : '',
            date: selectedTransaction ? selectedTransaction.date : '',
            amount: selectedTransaction ? selectedTransaction.amount : '',
            selectedCard:selectedTransaction ? selectedTransaction.selectedCard : '',
            type:selectedTransaction ? selectedTransaction.type : '',
            key: selectedTransaction ? selectedTransaction.key : ''
        });
    }, [selectedTransaction]);

    const handleEditClick = (record) => {
        setIsModalEditOpen(true)
        setSelectedTransaction(record)
        console.log(record,'record.transactions')
    }
    const handleDeleteClick = (record) => {
        setIsModalDeleteOpen(true)
        setSelectedTransaction(record)
        console.log(record,'record.transactions')
    }
    const handleSubmit = (evt) => {
        evt.preventDefault();

        if (!state.transactions.length) {
            message.error('Write at least 1 character for the transaction');
        } else if (!state.date.length) {
            message.error('Write at least 1 character for the date');
        } else if (!state.amount.length) {
            message.error('Write at least 1 character for the amount');
        } else if (!state.selectedCard.length) {
            message.error('Select a card');
        }  else if (parseFloat(state.amount) > parseFloat(selectedTransaction.amount) + parseFloat(cardDataList.find(card => card.number === state.selectedCard)?.balance)) {
            // Insufficient balance if state.amount > selectedTransaction.amount + balance
            message.error('Insufficient balance');
        }  else {
            // Proceed with submission
            fetchEditTransaction(state);
            setIsModalEditOpen(false);
            message.success('Transaction updated successfully');
        }
    };


    const handleInputChange = (evt) => {
        console.log(evt.target,'evt')
        const { name, value } = evt.target;
        setState((prevState) => ({
            ...prevState,
            [name]: value,
        }));
    };

    const handleDelete = (transactionkey) => {
        fetchDeleteTransaction(transactionkey)
        setIsModalDeleteOpen(false)
        message.success('Transaction deleted');

    }
    const columns = [
        {
            title: 'Transactions',
            dataIndex: 'transactions',
            key: 'transactions',
        },
        {
            title: 'Date',
            dataIndex: 'date',
            key: 'date',
        },
        {
            title: 'Amount',
            dataIndex: 'amount',
            key: 'amount',
            render: (text, record) => {
                const textStyle = record.type === 'expenses' ? { color: 'red' } : { color: 'green' };
                const icon = record.type === 'expenses' ? <CaretDownOutlined /> : <CaretUpOutlined />;
                return (
                    <span style={textStyle}>
           {icon} {text}
        </span>
                );
            },
        },
        {
            title: 'Card Number',
            dataIndex: 'selectedCard',
            key: 'selectedCard',
        },
        {
            title: 'Actions',
            dataIndex: 'actions',
            key: 'actions',
            className: css.actionsColumn,
            render: (text, record) => (
                <div className={css.action_container}>
                    <EditOutlined className={css.icons} onClick={() => handleEditClick(record)} />
                    <DeleteOutlined className={css.icons} onClick={() => handleDeleteClick(record)} />
                </div>
            ),
        },
    ];

    const onSelectChange = (newSelectedRowKeys) => {
        setSelectedRowKeys(newSelectedRowKeys);
    };

    const rowSelection = {
        selectedRowKeys,
        onChange: onSelectChange,
        selections: [
            Table.SELECTION_ALL,
            Table.SELECTION_INVERT,
            Table.SELECTION_NONE,
        ],
    };
    const handleTableChange = (pagination, filters, sorter) => {
        setCurrentPage(pagination.current);
    };
    const getPaginatedData = () => {
        const startIndex = (currentPage - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        return profileTransaction.slice(startIndex, endIndex);
    };
    const handleCardSelect = (value) => {
        setState((prev) => ({
            ...prev,
            selectedCard: value
        }));
    };

    return (
        <div className={css.transaction}>
            <div className={css.header}>
                <div className={css.headerLeft}>
                    <h2>Transaction</h2>
                </div>
                <div className={css.headerRighte}>
                    <Search
                        placeholder="Search text"
                        onSearch={onSearch}
                        style={{
                            width: 200,
                        }}
                    />
                    <TransactionModal fetchProfile={fetchProfile}  cardDataList={cardDataList}  cardNumbers={cardNumbers} setCardNumbers={setCardNumbers}  isModalOpen={isModalOpen} setIsModalOpen={setIsModalOpen}/>
                    <Modal
                        title={`Edit Transaction ${selectedTransaction ? selectedTransaction.transactions : ''}`}
                        open={isModalEditOpen} // Conditionally render based on state
                        onCancel={() => setIsModalEditOpen(false)} // Close modal on cancel
                        footer={null}
                        width={350}
                    >
                        <form className={css.form} onSubmit={handleSubmit}>
                            <Select
                                value={state.selectedCard}
                                placeholder="Select Card Number"
                                defaultValue="Type"
                                style={{
                                    width: "100%",
                                }}
                                onChange={handleCardSelect}
                                options={cardNumbers ? cardNumbers.map(number => ({
                                    value: number,
                                    label: number,
                                })) : ""}
                            />
                            <Input
                                type="text"
                                name="transactions"
                                value={state.transactions}
                                onChange={handleInputChange}
                                placeholder="Transactions"
                            />
                            <Input
                                type="date"
                                name="date"
                                value={state.date}
                                onChange={handleInputChange}
                                placeholder="Date"
                            />
                            <Input
                                type="text"
                                name="amount"
                                value={state.amount}
                                onChange={handleInputChange}
                                placeholder={"Amount"}
                            />
                            <p>
                                Balance of selected
                                card: {state.selectedCard && cardDataList.find(card => card.number === state.selectedCard)
                                ? (cardDataList.find(card => card.number === state.selectedCard)?.balance || 0)
                                + parseFloat(selectedTransaction.amount || 0)
                                - parseFloat(state.amount || 0)
                                : 0}
                            </p>

                            <Button type="primary" htmlType="submit">
                                Update
                            </Button>
                        </form>
                    </Modal>
                    <Modal
                        title={`Delete ${selectedTransaction ? selectedTransaction.transactions : ''}`}
                        open={isModalDeleteOpen}
                        onCancel={() => setIsModalDeleteOpen(false)}
                        footer={null}
                        width={250}
                    >
                        <div className={css.deleteContainer}>
                            <Button type="primary" danger onClick={() =>handleDelete(selectedTransaction.key)}>
                                Delete
                            </Button>
                        </div>
                    </Modal>

                </div>
            </div>
            <div className={css.body}>
                <div className={css.transactionGrid}>
                    {profileLoading ? <LoadingSpin/>
                    :
                        <Table
                        rowSelection={rowSelection}
                    dataSource={getPaginatedData()}
                    columns={columns}
                    pagination={{
                        pageSize: pageSize,
                        current: currentPage,
                        total: profileTransaction.length,
                    }}
                    onChange={handleTableChange}
                    className="table-striped-rows studio-table-rows priceListTable"
                />
                }
                </div>
            </div>
        </div>
    );
};

export default Transaction;
