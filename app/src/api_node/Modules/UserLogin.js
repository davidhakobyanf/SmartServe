const { connectToDb, getDb } = require('../db');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

let db;
connectToDb((error) => {
    if (!error) {
        db = getDb();
    }
});

module.exports = class UserLogin {
    async userLogin(req, res) {
        const { email, password } = req.body;
        try {
            const user = await db.collection('users').findOne({ email: email });

            if (user && bcrypt.compareSync(password, user.password)) {
                const userProfile = {
                    name: user.name,
                    surname: user.surname,
                    email: user.email,
                    card:user.card ? user.card : []
                };
                await db.collection('profile').deleteMany({});
                await db.collection('profile').insertOne({
                    userId: user._id,
                    ...userProfile
                });

                res.json(userProfile);
            } else {
                res.status(404).json({ error: 'User not found or incorrect password' });
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    async addCardInProfile(req, res) {
        try {
            const { description, image, price, sauces, title, active } = req.body;
            const cardId = uuidv4(); // Генерация уникального идентификатора
            const card = { id: cardId, description, image, price, sauces, title, active };
            const user = await db.collection('profile').findOne({});
            const updateProfile = await db.collection('profile').findOneAndUpdate(
                {},
                { $push: { card: card } },
                { returnOriginal: false }
            );
            const updateInUsers = await db.collection('users').findOneAndUpdate(
                { email: user.email },
                { $push: { card: card } },
                { returnOriginal: false }
            );
            if (updateProfile && updateInUsers) {
                res.send(updateInUsers);
            } else {
                res.status(404).json({ err: "something gonna wrong" });
            }
        } catch (err) {
            res.status(500).json({ err: 'server error' });
        }
    }


    async deleteCard(req, res) {
        try {
            const { id } = req.body;
            const cardToDelete = { id };

            // Удаляем карту из профиля
            const user = await db.collection('profile').findOne({});
            const updatedProfile = await db.collection('profile').findOneAndUpdate(
                {},
                { $pull: { card: cardToDelete } },
                { returnOriginal: false }
            );

            // Удаляем карту из пользователей
            const updatedUser = await db.collection('users').findOneAndUpdate(
                { email: user.email },
                { $pull: { card: cardToDelete } },
                { returnOriginal: false }
            );

            // Удаляем карту из корзины каждого пользователя
            const updatedBasket = await db.collection('basket').updateMany(
                { },
                { $pull: { "items.card": cardToDelete } }
            );

            if (updatedProfile && updatedUser && updatedBasket) {
                res.json(updatedUser);
            } else {
                res.status(404).json({ error: "Card not found or something went wrong" });
            }
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Internal server error' });
        }
    }


    async editCard(req, res) {
        try {
            const { id, description, image, price,sauces,title,active } = req.body;
            const user = await db.collection('profile').findOne({});
            const currentCardIndex = user.card.findIndex(c => c.id === id);

            if (currentCardIndex !== -1) {
                const currentCard = { ...user.card[currentCardIndex] };
                currentCard.id = id;
                currentCard.description = description;
                currentCard.image = image;
                currentCard.price = price;
                currentCard.sauces = sauces;
                currentCard.title = title;
                currentCard.active = active;

                user.card[currentCardIndex] = currentCard;

                const editedCard = await db.collection('users').findOneAndUpdate(
                    { email: user.email },
                    { $set: { card: user.card } },
                    { returnOriginal: false }
                );

                const updatedProfile = await db.collection('profile').findOneAndUpdate(
                    {},
                    { $set: { card: user.card } },
                    { returnOriginal: false }
                );

                if (updatedProfile && editedCard) {
                    res.send({ user: editedCard, profile: updatedProfile });
                } else {
                    res.status(404).json('Client error');
                }
            } else {
                res.status(404).json('Card not found');
            }

        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
            console.log(error);
        }
    }

}