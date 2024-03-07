import React from 'react';
import { useNavigate } from 'react-router-dom';
import css from './ClientTable.module.css';
import { GiTable } from "react-icons/gi";
import Card from "@mui/joy/Card";

const ClientTable = () => {
    const navigate = useNavigate();

    const handleNavigateToClient = (clientId) => {
        navigate(`/client/${clientId}`);
    };

    return (
        <div className={css.clientTable}>
            {[1, 2, 3, 4, 5, 6,7,8].map((clientId) => (
                <Card key={clientId} className={css.chair} onClick={() => handleNavigateToClient(clientId)}>
                    Client {clientId} <GiTable />

                </Card>
            ))}
        </div>
    );
};

export default ClientTable;
