const { connectToDb, getDb } = require("../db.js");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
let db;
connectToDb((error) => {
    if (!error) {
        db = getDb();
    }
});


module.exports = class Login {
    async login(req, res) {
        try {
            // Find user in MongoDB
            const user = await db.collection("users").findOne({ email });

            // stugum enq usery goyutyun uni te che ev goyutyun uni ardyoq hash passwordy
            if (user && await bcrypt.compare(password, user.password)) {
                // Successful created JWT token
                const token = jwt.sign({ userId: user._id }, 'your-secret-key', { expiresIn: '1h' });

                res.status(200).json({ message: 'Login successful', token });
            } else {
                res.status(401).json({ error: 'Invalid credentials' });
            }
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Server error' });
        }
    }
}