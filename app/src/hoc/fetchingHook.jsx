import {useState} from "react";
export const useFetching = (asyncCallback) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetching = async (...args) => {
        try {
            setIsLoading(true);
            await asyncCallback(...args);
        } catch (e) {
            setError(e);
        } finally {
            setIsLoading(false);
        }
    };

    return [fetching, isLoading, error];
};