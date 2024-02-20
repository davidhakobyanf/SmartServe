const { connectToDb, getDb } = require('../db');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
let db;
connectToDb((error) => {
    if (!error) {
        db = getDb();
    }
});

module.exports = class Transaction{
    async userTransaction(req, res) {
        try {
            const { transactions, date, amount, type, selectedCard, key = uuidv4() } = req.body;
            const action = { transactions, date, amount, type, selectedCard, key };
            const user = await db.collection('profile').findOne({});
            const currentCard = user.card.find(card => card.number === selectedCard);
    
            if (currentCard) {
                currentCard.balance = parseFloat(currentCard.balance);

                if (type === 'expenses') {
                    currentCard.balance -= parseFloat(amount);
                } else if (type === 'income') {
                    currentCard.balance += parseFloat(amount);
                }
    
                const updateInUsers = await db.collection('users').findOneAndUpdate(
                    { email: user.email },
                    { $push: { transaction: action } },
                    { returnOriginal: false }
                );
    
                const updateProfile = await db.collection('profile').findOneAndUpdate(
                    {},
                    { $push: { transaction: action } },
                    { returnOriginal: false }
                );
    
                if (updateInUsers && updateProfile) {
                    await db.collection('users').updateOne(
                        { email: user.email, 'card.number': selectedCard },
                        { $set: { 'card.$.balance': currentCard.balance } }
                    );
    
                    await db.collection('profile').updateOne(
                        { 'card.number': selectedCard },
                        { $set: { 'card.$.balance': currentCard.balance } }
                    );
    
                    res.send(updateInUsers);
                } else {
                    res.status(404).json({ err: "Something went wrong" });
                }
            } else {
                res.status(404).json({ err: "Selected card not found" });
            }
        } catch (err) {
            console.error(err);
            res.status(500).json({ err: 'Server error' });
        }
    }
    
    async deleteTransaction (req, res){
        try{
            const {key} = req.body;
            const TransactionToDelete = {key};
            const user = await db.collection('profile').findOne({});
            const currentTrans = user.transaction.find(t => t.key === key);
            const currentCard = user.card.find(c => c.number === currentTrans.selectedCard);

            if(currentCard && currentTrans) {
                currentCard.balance = parseFloat(currentCard.balance);
                if(currentTrans.type === 'expenses') {
                    currentCard.balance += parseFloat(currentTrans.amount);
                } else {
                    currentCard.balance -= parseFloat(currentTrans.amount)
                }
            }

            await db.collection('users').updateOne(
                { email: user.email, 'card.number': currentTrans.selectedCard },
                { $set: { 'card.$.balance': currentCard.balance } }
            );

            await db.collection('profile').updateOne(
                { 'card.number': currentTrans.selectedCard },
                { $set: { 'card.$.balance': currentCard.balance } } 
            )

            const updatedProfile = await db.collection('profile').findOneAndUpdate(
                {},
                {$pull: {transaction: TransactionToDelete}},
                {returnOriginal:false}
            )
            const updatedUser = await db.collection('users').findOneAndUpdate(
                { email: user.email },
                { $pull: { transaction: TransactionToDelete } },
                { returnOriginal: false }
            );
            if (updatedProfile && updatedUser) {
                res.json(updatedUser);
            } else {
                res.status(404).json({ error: "Card not found or something went wrong" });
            }
        }catch (err){
            console.log(err);
            res.status(500).json({error: 'Internal server error' })
        }
    }
    async editTransaction(req, res) {
        try {
            const { key, transactions, date, amount, type, selectedCard} = req.body;
            const user = await db.collection('profile').findOne({});
            const currentCard = user.card.find(card => card.number === selectedCard);
            const currentTransactionIndex = user.transaction.findIndex(t => t.key === key);
    
            if (currentTransactionIndex !== -1) {
                const currentTransaction = { ...user.transaction[currentTransactionIndex] };
                let transactionAmountBeforeUpdate = currentTransaction.amount
                currentTransaction.transactions = transactions;
                currentTransaction.date = date;
                currentTransaction.amount = amount;
                currentTransaction.selectedCard = selectedCard;
                currentTransaction.type = type;


                user.transaction[currentTransactionIndex] = currentTransaction;
                if ( currentTransaction.type === 'expenses' && transactionAmountBeforeUpdate > amount ) { 
                    transactionAmountBeforeUpdate = Number( transactionAmountBeforeUpdate  - amount )
                    currentCard.balance += transactionAmountBeforeUpdate
                    await db.collection('profile').updateOne(
                        { 'card.number': selectedCard },
                        { $set: { 'card.$.balance': currentCard.balance } }
                    );
                    await db.collection('users').updateOne(
                        { email: user.email, 'card.number': selectedCard },
                        { $set: { 'card.$.balance': currentCard.balance } }
                    );
                } else if ( currentTransaction.type === 'expenses' && transactionAmountBeforeUpdate < amount ) { 
                    console.log(true)
                    transactionAmountBeforeUpdate = amount - transactionAmountBeforeUpdate
                    currentCard.balance -= transactionAmountBeforeUpdate
                    await db.collection('profile').updateOne(
                        { 'card.number': selectedCard },
                        { $set: { 'card.$.balance': currentCard.balance } }
                    );
                    await db.collection('users').updateOne(
                        { email: user.email, 'card.number': selectedCard },
                        { $set: { 'card.$.balance': currentCard.balance } }
                    );
                } else if ( currentTransaction.type === 'income' && transactionAmountBeforeUpdate > amount ) { 
                    transactionAmountBeforeUpdate = Number( transactionAmountBeforeUpdate  - amount )
                    currentCard.balance -= transactionAmountBeforeUpdate
                    await db.collection('profile').updateOne(
                        { 'card.number': selectedCard },
                        { $set: { 'card.$.balance': currentCard.balance } }
                    );
                    await db.collection('users').updateOne(
                        { email: user.email, 'card.number': selectedCard },
                        { $set: { 'card.$.balance': currentCard.balance } }
                    );
                } else if ( currentTransaction.type === 'income' && transactionAmountBeforeUpdate < amount ) { 
                    transactionAmountBeforeUpdate = Number( amount - transactionAmountBeforeUpdate )
                    currentCard.balance += transactionAmountBeforeUpdate
                    await db.collection('profile').updateOne(
                        { 'card.number': selectedCard },
                        { $set: { 'card.$.balance': currentCard.balance } }
                    );
                    await db.collection('users').updateOne(
                        { email: user.email, 'card.number': selectedCard },
                        { $set: { 'card.$.balance': currentCard.balance } }
                    );
                }


                const updatedTrans = await db.collection('users').findOneAndUpdate(
                    { email: user.email },
                    { $set: { transaction: user.transaction } },
                    { returnOriginal: false }
                );

    
                const updatedProfile = await db.collection('profile').findOneAndUpdate(
                    {},
                    { $set: { transaction: user.transaction } },
                    { returnOriginal: false }
                );
    
                if (updatedTrans && updatedProfile) {
                    res.json({ user: updatedTrans, profile: updatedProfile });
                } else {
                    res.status(404).json('Client error');
                }
            } else {
                res.status(404).json('Transaction not found');
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}