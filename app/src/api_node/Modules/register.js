const { connectToDb, getDb } = require("../db.js");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

let db;
connectToDb((error) => {
    if (!error) {
        db = getDb();
    }
});

function isValidPassword(password) {
    const minLength = 6;
    const hasLowercase = /[a-z]/.test(password);
    const hasUppercase = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return (
        password.length >= minLength &&
        hasLowercase &&
        hasUppercase &&
        hasNumber &&
        hasSpecialChar
    );
}

module.exports = class Register {
    async reg(req, res) {
        const { name, surname, email, password} = req.body;
        try {
            // Validate password
            if (!isValidPassword(password)) {
                return res.status(400)
                    .json({ error: 'Invalid password. It must be at least 6 characters long with a mix of lowercase, uppercase, digits, and special characters.' })
            }

            // Check if the email already exists
            const existingUser = await db.collection("users").findOne({ email });

            if (existingUser) {
                return res.status(400).json({ error: 'Email is already registered.' });
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            const user = { name, surname, email,  password: hashedPassword };
            await db.collection("users").insertOne(user);

            // Retrieve the registered user
            const registeredUser = await db.collection("users").findOne({ email });

            if (registeredUser) {
                // Generate JWT token for the registered user
                const token = jwt.sign({ userId: registeredUser._id }, 'your-secret-key', { expiresIn: '1h' });

                res.status(200).json({ message: 'User registered successfully', token });
            } else {
                res.status(404).json({ error: 'User not found after registration' });
            }
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Server error' });
        }
    }
}
