const { MongoClient } = require('mongodb');
let dbConnection
module.exports = {
    connectToDb: (cb) => {
        MongoClient.connect('mongodb+srv://hakobyandavid2003:David29102003@cluster0.81bivx8.mongodb.net/SmartServe')
            .then ((client) => {
                dbConnection = client.db()
                return cb()
            })
            .catch ((error) => {
                console.log(error);
                return cb(error)
            })
    },
    getDb: () => dbConnection
}