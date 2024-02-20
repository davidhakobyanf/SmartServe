const { getDb, connectToDb } = require('../db');
let db;
connectToDb((error) => {
    if(!error) {
        db = getDb();
    }
});

module.exports = class Profile {
    async user(req, res) {
        try {
            const profiles = await db.collection('profile').find().toArray();

            if (profiles.length > 0) {
                const lastProfile = profiles[profiles.length - 1];
                const { name, surname} = lastProfile;
                res.json({ name, surname});
            } else {
                res.status(404).json({ error: 'No profiles found' });
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal server error' });
        }
    };
}