import React, { useState, useEffect } from 'react';
import Slider from 'react-slick';
import css from './Dashboard.module.css';
import ProfileInfo from './ProfileInfo/ProfileInfo';
import { Button } from 'antd';
import Cards from 'react-credit-cards-2';
import CustomModal from '../Modal/Modal';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import { useFetching } from "../../../hoc/fetchingHook";
import clientAPI from "../../../api/api";
import LoadingSpin from "../../../hoc/LoadingSpin";
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Scrollbar, A11y } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import EditCardDelete from "../Modal/ModalEditDelete/EditCardDelete";
import { Chart } from "react-google-charts";
import { useCardData } from "../../../context/CardDataContext";
import { useProfileData } from "../../../context/ProfileDataContext";
import Table from "antd/lib/table";
import {CaretDownOutlined, CaretUpOutlined, DeleteOutlined, EditOutlined} from "@ant-design/icons";

const Dashboard = () => {
    const [balance, setBalance] = useState();
    const [initialBalance, setInitialBalance] = useState();
    const [incomeBalance, setIncomeBalance] = useState(0);
    const [expensesBalance, setExpensesBalance] = useState(0);
    const [totalBalance, setTotalBalance] = useState(0);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const { cardDataList, setCardDataList } = useCardData();
    const { profileDataList, setProfileDataList, profileTransaction, setProfileTransaction } = useProfileData();
    const [selectedCard, setSelectedCard] = useState(null);
    const [selectedRowKeys, setSelectedRowKeys] = useState([]);
    const onSelectChange = (newSelectedRowKeys) => {
        setSelectedRowKeys(newSelectedRowKeys);
    };
    const handleCardClick = (cardData) => {
        setSelectedCard(cardData);
        setBalance(cardData.balance);
        setInitialBalance(cardData.balance);
        setDeleteModalOpen(true);
    };

    const fetchProfile = async () => {
        try {
            const { data: res } = await clientAPI.getProfile();
            if (res) {
                setCardDataList(res.card);
                setProfileTransaction(res.transaction);
                setProfileDataList(res);
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, [isModalOpen, deleteModalOpen]);

    useEffect(() => {
        if (cardDataList) {
            const total = cardDataList.reduce((acc, card) => acc + parseFloat(card.balance), 0);
            setTotalBalance(total);
        }
        if (profileTransaction) {
            let incomeTotal = 0;
            let expensesTotal = 0;
            profileTransaction.forEach(transaction => {
                const amount = parseFloat(transaction.amount);
                if (transaction.type === 'income') {
                    incomeTotal += amount;
                } else if (transaction.type === 'expenses') {
                    expensesTotal += amount;
                }
            });
            setIncomeBalance(incomeTotal);
            setExpensesBalance(expensesTotal);
        }
        const currentCardData = cardDataList[0];
        if (currentCardData) {
            setBalance(initialBalance !== undefined ? initialBalance : (currentCardData.balance ? currentCardData.balance : 0));
        }
    }, [cardDataList, profileTransaction, initialBalance, expensesBalance, incomeBalance]);

    const handleSlideChange = (swiper) => {
        const currentCardData = cardDataList[swiper.activeIndex];
        if (currentCardData) {
            const bal = currentCardData.balance ? currentCardData.balance : 0;
            setBalance(bal);
        }
    };

    const prepareChartData = () => {
        const chartData = [["Day", "Income", "Expenses"]];
        if (profileTransaction) {
            const dayMap = new Map();
            profileTransaction.forEach(transaction => {
                const day = new Date(transaction.date).getDate();
                if (!dayMap.has(day)) {
                    dayMap.set(day, { income: 0, expenses: 0 });
                }
                const amount = parseFloat(transaction.amount);
                if (transaction.type === 'income') {
                    dayMap.get(day).income += amount;
                } else if (transaction.type === 'expenses') {
                    dayMap.get(day).expenses += amount;
                }
            });
            // Convert Map to Array and sort by date in descending order
            const sortedDays = Array.from(dayMap.entries()).sort((a, b) => b[0] - a[0]);
            sortedDays.forEach(([day, dayData]) => {
                chartData.push([day, dayData.income, dayData.expenses]);
            });
        }
        return chartData;
    };


    const data = prepareChartData();


    const options = {
        chart: {
            title: "Your Performance",
            subtitle: "Sales, Expenses at this month",
        },
    };

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
    ];

    return (
        <div className={css.dashboard}>
            <div className={css.header}>
                <h2 className={css.title}>Dashboard</h2>
                <ProfileInfo/>
            </div>
            <div className={css.body}>
                <div className={css.bodyLeft}>
                    <div className={css.creditcard}>
                        <div className={css.top}>
                            <div className={css.topLeft}>
                                <h5>Total balance</h5>
                                <h3>${totalBalance}</h3>
                            </div>
                            <div className={css.topRight}>
                                <div className={css.miniLogo}>

                                </div>
                            </div>
                        </div>
                        <div className={css.bottom}>
                            <div className={css.bottomLeft}>
                                <h5>My income</h5>
                                <h3>${incomeBalance}</h3>
                            </div>
                            <div className={css.bottomRight}>
                                <h5>My Expenses</h5>
                                <h3>${expensesBalance}</h3>
                            </div>
                        </div>
                    </div>
                </div>
                <div className={css.bodyRight}>
                    <div className={css.cards}>
                        <Swiper
                            modules={[Navigation, Pagination, Scrollbar, A11y]}
                            spaceBetween={50}
                            slidesPerView={1}
                            pagination={{ clickable: true }}
                            className={css.swiper}
                            style={{
                                marginLeft: "0px",
                                marginRight: "0px"
                            }}
                            onSlideChange={handleSlideChange}
                        >
                            {!cardDataList.length ?
                                (<SwiperSlide key={0} className={css.slide} >
                                    <Cards
                                        number={"................"}
                                        expiry={"...."}
                                        name={"YOUR NAME HERE"}
                                        focused={"........"}
                                    />
                                </SwiperSlide>) :
                                (cardDataList.map((cardData, index) => (
                                    <SwiperSlide key={index} className={css.slide} onClick={() => handleCardClick(cardData)}>
                                        <Cards
                                            number={cardData.number}
                                            expiry={cardData.expiry}
                                            name={cardData.name}
                                            focused={cardData.focus}
                                        />
                                    </SwiperSlide>
                                )))
                            }
                        </Swiper>
                    </div>
                    <div className={css.right}>
                        <CustomModal setIsModalOpen={setIsModalOpen} isModalOpen={isModalOpen} cardDataList={cardDataList} setCardDataList={setCardDataList} />
                        <div className={css.balance}>
                            <div>Balance</div>
                            <div className={css.font_balance}>{balance}</div>
                        </div>
                    </div>
                </div>
                <EditCardDelete profileTransaction={profileTransaction} fetchProfile={fetchProfile} cardDataList={cardDataList} setDeleteModalOpen={setDeleteModalOpen} deleteModalOpen={deleteModalOpen} selectedCard={selectedCard} />
            </div>
            <div className={css.footer}>
                <div className={css.footerLeft}>
                    <Chart chartType="Line" width="100%" height="300px" data={data} options={options}/>
                </div>
                <div className={css.footerRight}>
                    <div className={css.scrollableTable}>
                        <Table
                            style={{width: "100%", height: "100%"}}
                            columns={columns}
                            dataSource={profileTransaction.map((transaction, index) => ({
                                key: index,
                                transactions: transaction.transactions,
                                date: transaction.date,
                                amount: transaction.amount,
                                type: transaction.type,
                            }))}
                            pagination={false}
                            className="table-striped-rows studio-table-rows priceListTable"
                        />
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Dashboard;
