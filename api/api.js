const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { getDb, connectToDb } = require('./db');
const registerRoute = require('./Route/RegisterRoute')
const loginRoute = require('./Route/loginRoute')
const ProfileRoute = require('./Route/ProfileRoute');
const userLoginRouter = require('./Route/UserLoginRoute');
const basketRoute = require('./Route/BasketRoute');
const AuthenticateRoute = require('./Route/AuthenticateRoute');
const allbasketRoute = require('./Route/allbasketRoute');
const app = express();
const PORT = 8000;

app.use(express.json());
app.use(bodyParser.json());
app.use(cors());
app.use(userLoginRouter);
app.use(basketRoute);
app.use(allbasketRoute);
app.use(AuthenticateRoute)
app.use(registerRoute);
app.use(loginRoute);
app.use(ProfileRoute); 
let db;
connectToDb((error) => {
    if (!error) {
        app.listen(PORT, (error) => {
            error ? console.log(error) : console.log(`The PORT ${PORT} is listening`);
        });
    }
    db = getDb();
});
