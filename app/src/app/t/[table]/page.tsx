'use client';
import { useParams, useRouter   } from "next/navigation";
import { useEffect, useState } from "react";
import DataApi from '@/api/api';

export default function TableEntryPage() {
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

    if (error) return <p>Չստացվեց բացել QR խնդրում ենք նորից սկան անել QR-ը:</p>;
    return <p>Բացվում է QR...</p>;
}