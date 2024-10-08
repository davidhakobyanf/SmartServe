const { connectToDb, getDb } = require('../db');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

let db;
connectToDb((error) => {
    if (!error) {
        db = getDb();
    }
});

module.exports = class UserBasket {
    async deleteAllBasket(req, res) {
        try {
            const { table } = req.body;

            // Удаляем все карты для указанного стола
            const updatedProfile = await db.collection('basket').findOneAndUpdate(
                { },
                { $unset: { [`tables.${table}`]: "" } },
                { returnOriginal: false }
            );

            if (updatedProfile) {
                res.json(updatedProfile);
            } else {
                res.status(404).json({ error: "Стол не найден или что-то пошло не так" });
            }
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Внутренняя ошибка сервера' });
        }
    }


    async deleteCardInBasket(req, res) {
        try {
            const { table, id } = req.body;
            const cardToDelete = { id };

            // Удаляем карту из профиля
            const updatedProfile = await db.collection('basket').findOneAndUpdate(
                { },
                { $pull: { [`tables.${table}`]: cardToDelete } },
                { returnOriginal: false }
            );
            if (updatedProfile) {
                res.json(updatedProfile);
            } else {
                res.status(404).json({ error: "Карта не найдена или что-то пошло не так" });
            }
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Внутренняя ошибка сервера' });
        }
    }


    // async userLogin(req, res) {
    //     const { email, password } = req.body;
    //     try {
    //         const user = await db.collection('users').findOne({ email: email });
    //
    //         if (user && bcrypt.compareSync(password, user.password)) {
    //             const userProfile = {
    //                 name: user.name,
    //                 surname: user.surname,
    //                 email: user.email,
    //                 card:user.card ? user.card : []
    //             };
    //             await db.collection('profile').deleteMany({});
    //             await db.collection('profile').insertOne({
    //                 userId: user._id,
    //                 ...userProfile
    //             });
    //
    //             res.json(userProfile);
    //         } else {
    //             res.status(404).json({ error: 'User not found or incorrect password' });
    //         }
    //     } catch (error) {
    //         console.error(error);
    //         res.status(500).json({ error: 'Internal server error' });
    //     }
    // }
    async getCardInBasket(req, res) {
        try {
            const basket = await db.collection('basket').findOne({});
            if (!basket) {
                res.status(404).json({ error: 'Basket not found' });
            } else {
                res.json(basket.tables);
            }
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Server error' });
        }
    }


    async addCardInBasket(req, res) {
        try {
            const { id, description, image, price, sauces, title, active, table, count } = req.body;

            const card = { id, description, image, price, sauces, title, active, table, count };
            let basket = await db.collection('basket').findOne({});

            if (!basket) {
                const newBasket = { tables: {} };
                newBasket.tables[table] = [card];
                const result = await db.collection('basket').insertOne(newBasket);
                res.send(result.ops[0]);
            } else {
                let found = false;
                if (basket.tables[table]) {
                    // Check if card with the same id exists in the table
                    basket.tables[table].forEach(existingCard => {
                        if (existingCard.id === id && JSON.stringify(existingCard.sauces) === JSON.stringify(sauces)) {
                            existingCard.count += count;
                            found = true;
                        }
                    });
                } else {
                    basket.tables[table] = [];
                }

                if (!found) {
                    basket.tables[table].push(card);
                }

                const updateResult = await db.collection('basket').updateOne(
                    {},
                    { $set: { tables: basket.tables } }
                );

                if (updateResult.modifiedCount > 0) {
                    res.send(basket);
                } else {
                    res.status(500).json({ err: 'Failed to update basket' });
                }
            }
        } catch (err) {
            res.status(500).json({ err: 'Server error' });
        }
    }







    // async deleteCard(req, res) {
    //     try {
    //         const { id } = req.body;
    //         const cardToDelete = { id };
    //
    //         const user = await db.collection('profile').findOne({});
    //         const updatedProfile = await db.collection('profile').findOneAndUpdate(
    //             {},
    //             { $pull: { card: cardToDelete } },
    //             { returnOriginal: false }
    //         );
    //
    //         const updatedUser = await db.collection('users').findOneAndUpdate(
    //             { email: user.email },
    //             { $pull: { card: cardToDelete } },
    //             { returnOriginal: false }
    //         );
    //
    //         if (updatedProfile && updatedUser) {
    //             res.json(updatedUser);
    //         } else {
    //             res.status(404).json({ error: "Card not found or something went wrong" });
    //         }
    //     } catch (err) {
    //         console.error(err);
    //         res.status(500).json({ error: 'Internal server error' });
    //     }
    // }
    //
    // async editCard(req, res) {
    //     try {
    //         const { id, description, image, price,sauces,title,active } = req.body;
    //         const user = await db.collection('profile').findOne({});
    //         const currentCardIndex = user.card.findIndex(c => c.id === id);
    //
    //         if (currentCardIndex !== -1) {
    //             const currentCard = { ...user.card[currentCardIndex] };
    //             currentCard.id = id;
    //             currentCard.description = description;
    //             currentCard.image = image;
    //             currentCard.price = price;
    //             currentCard.sauces = sauces;
    //             currentCard.title = title;
    //             currentCard.active = active;
    //
    //             user.card[currentCardIndex] = currentCard;
    //
    //             const editedCard = await db.collection('users').findOneAndUpdate(
    //                 { email: user.email },
    //                 { $set: { card: user.card } },
    //                 { returnOriginal: false }
    //             );
    //
    //             const updatedProfile = await db.collection('profile').findOneAndUpdate(
    //                 {},
    //                 { $set: { card: user.card } },
    //                 { returnOriginal: false }
    //             );
    //
    //             if (updatedProfile && editedCard) {
    //                 res.send({ user: editedCard, profile: updatedProfile });
    //             } else {
    //                 res.status(404).json('Client error');
    //             }
    //         } else {
    //             res.status(404).json('Card not found');
    //         }
    //
    //     } catch (error) {
    //         res.status(500).json({ error: 'Internal server error' });
    //         console.log(error);
    //     }
    // }

}