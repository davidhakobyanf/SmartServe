'use client';
import { useParams } from "next/navigation";
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from "react";
import DataApi from '@/api/api';

export default function TableEntryPage() {
    const t = useTranslations('client');
    const params = useParams();
    const router = useRouter();
    const [error, setError] = useState(false);

    useEffect(() => {
        const table = Number(params?.table);
        if (!table) {
            setError(true);
            return;
        }
        DataApi.openSession(table)
            .then((res) => router.replace(`/client/${res.data.id}`))
            .catch(() => setError(true));
    }, [params, router]);

    if (error) return <p>{t('qr.error')}</p>;
    return <p>{t('qr.opening')}</p>;
}