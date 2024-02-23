import axios from "axios";

const instance = axios.create({
    baseURL: 'http://localhost:8000',
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    },
});

class DataApi {
    static async getProfile() {
        try {

            const response = await instance.get('/api/profile', {
                headers: {
                    'Authorization': `Bearer `,
                    'Content-Type': 'application/json',
                },
            });

            return response;
        } catch (error) {
            console.error(error);
            // Handle the error as needed, or rethrow it if further handling is required.
            throw error;
        }
    }
    static async createCard(card) {
        try {
            const headers = {
                Authorization: `Bearer`,
                'Content-Type': 'application/json',
            };
            const response = await instance.patch('/api/user/login', card,
                {headers});
            return response;
        } catch (error) {
            console.error(error);
            throw error;
        }
    }
}

export default DataApi;
