import React from 'react';
import { Spin } from 'antd';

const LoadingSpin = ({ children }) => {
    return (
        <Spin tip="Loading" size="large" className="loadingClass">
            <div className="content">{children}</div>
        </Spin>
    );
};

export default LoadingSpin;