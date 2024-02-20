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
    static async deleteCard(card) {
        try {
            const headers = {
                Authorization: `Bearer`,
                'Content-Type': 'application/json',
            };
            const response = await instance.request({
                url: '/api/user/login',
                method: 'delete',
                headers,
                data: {
                    number: card,
                },
            });

            console.log(`"${card}"`,'card')
            console.log(response,'response')

            return response;
        } catch (error) {
            console.error(error);
            // Handle the error as needed, or rethrow it if further handling is required.
            throw error;
        }
    }

    static async createTransaction(table) { 
        try{
            const headers = {
                Authorization: `Bearer`,
                'Content-Type': 'application/json',
            };
            const response = await instance.patch('/api/user/login/transaction', table,{headers});
            console.log(table,'table')
            console.log(response,'response')
        }catch(err) { 
            console.error(err)
        }
    }
    static async deleteTransaction(transaction) {
        try {
            const headers = {
                Authorization: `Bearer`,
                'Content-Type': 'application/json',
            };
            const response = await instance.request({
                url: '/api/user/login/transaction',
                method: 'delete',
                headers,
                data: {
                    key: transaction,
                },
            });

            console.log(`"${transaction}"`,'card')
            console.log(response,'response')

            return response;
        } catch (error) {
            console.error(error);
            // Handle the error as needed, or rethrow it if further handling is required.
            throw error;
        }
    }
    static async editTransaction(transaction) {
        try{
            const headers = {
                Authorization: `Bearer`,
                'Content-Type': 'application/json',
            };
            const response = await instance.put('/api/user/login/transaction', transaction,{headers});
            console.log(transaction,'transaction')
            console.log(response,'response')
        }catch(err) {
            console.error(err)
        }
    }
    static async editCard(card) {
        try{
            const headers = {
                Authorization: `Bearer`,
                'Content-Type': 'application/json',
            };
            const response = await instance.put('/api/user/login', card,{headers});
            console.log(card,'transaction')
            console.log(response,'response')
        }catch(err) {
            console.error(err)
        }
    }
}

export default DataApi;
