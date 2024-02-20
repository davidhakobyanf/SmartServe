const jwt = require('jsonwebtoken');


module.exports = class AuthenticateToken {
    
    authenticateToken = (req, res, next) => {
        const token = req.header('Authorization');
    
        if (!token) return res.status(401).json({ error: 'Unauthorized' });
    
        jwt.verify(token, 'your-secret-key', (err, user) => {
            if (err) return res.status(403).json({ error: 'Invalid token' });
    
            req.user = user;
            next();
        });
    };
}