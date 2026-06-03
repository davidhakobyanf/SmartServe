'use client';

import { useRouter } from 'next/navigation';
import css from './ClientTable.module.css';
import { GiTable } from 'react-icons/gi';
import Card from '@mui/joy/Card';

export default function ClientTable() {
  const router = useRouter();

  const handleNavigateToClient = (clientId: number) => {
    router.push(`/client/${clientId}`);
  };

  return (
    <div className={css.clientTable}>
      {[1, 2, 3, 4, 5, 6, 7, 8].map((clientId) => (
        <Card
          key={clientId}
          className={css.chair}
          onClick={() => handleNavigateToClient(clientId)}
        >
          Client {clientId} <GiTable />
        </Card>
      ))}
    </div>
  );
}
