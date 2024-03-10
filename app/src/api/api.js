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
    static async getBasket() {
        try {

            const response = await instance.get('/api/basket', {
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
    static async createBasket(card) {
        try {
            const headers = {
                Authorization: `Bearer`,
                'Content-Type': 'application/json',
            };
            const response = await instance.patch('/api/basket', card,
                {headers});
            return response;
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    static async deleteAllBasket(table) {
        try {
            const headers = {
                Authorization: `Bearer`,
                'Content-Type': 'application/json',
            };
            const response = await instance.request({
                url: '/api/basket/all',
                method: 'delete',
                headers,
                data: {
                    table:table
                },
            });

            console.log(response,'response')

            return response;
        } catch (error) {
            console.error(error);
            // Handle the error as needed, or rethrow it if further handling is required.
            throw error;
        }
    }
    static async deleteBasket(id,table) {
        try {
            const headers = {
                Authorization: `Bearer`,
                'Content-Type': 'application/json',
            };
            const response = await instance.request({
                url: '/api/basket',
                method: 'delete',
                headers,
                data: {
                    id: id,
                    table:table
                },
            });

            console.log(`"${id}"`,'card')
            console.log(response,'response')

            return response;
        } catch (error) {
            console.error(error);
            // Handle the error as needed, or rethrow it if further handling is required.
            throw error;
        }
    }

    static async deleteCard(id) {
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
                    id: id,
                },
            });

            console.log(`"${id}"`,'card')
            console.log(response,'response')

            return response;
        } catch (error) {
            console.error(error);
            // Handle the error as needed, or rethrow it if further handling is required.
            throw error;
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
