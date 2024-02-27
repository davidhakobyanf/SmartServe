import React, { useState, useEffect } from 'react';
import { Table, Checkbox } from 'antd';

const DynamicCheckbox = ({ initialOptions }) => {
    const [plainOptions, setPlainOptions] = useState([]);
    const [selectedOptions, setSelectedOptions] = useState({});
    const [allTotal, setAllTotal] = useState(0);

    useEffect(() => {
        setPlainOptions(initialOptions.map(option => ({ option, total: 0 })));
    }, [initialOptions]);

    useEffect(() => {
        // Обновляем общий total при изменении состояния total каждого элемента
        const total = plainOptions.reduce((acc, curr) => acc + curr.total, 0);
        setAllTotal(total);
    }, [plainOptions]);

    const handleCheckboxChange = (key, checked) => {
        setSelectedOptions(prevState => ({
            ...prevState,
            [key]: checked
        }));

        setPlainOptions(prevOptions => prevOptions.map(option => {
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

    const data = plainOptions.map((option, index) => ({
        key: index,
        option: option.option,
        total: option.total,
    }));

    return (
        <>
            <Table columns={columns} dataSource={data} pagination={false} />
            <div style={{ marginTop: 16 }}>All Total: {allTotal}</div>
        </>
    );
};

export default DynamicCheckbox;
