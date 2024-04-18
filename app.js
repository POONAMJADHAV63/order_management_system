const express = require('express');
const clientRouter = require('./client');
const orderRouter = require('./order');

const app = express();
app.use(express.json());

// Middleware to route based on MsgType
app.post('/app',(req, res, next) => {
    console.log("i am in post api base")
    const { MsgType } = req.body;
    if (MsgType === 1120) {
        console.log("i am in ORDER api base")
        // Redirect to orderRouter
        orderRouter(req, res, next);
    } else if (MsgType === 1121) {
        console.log("i am in CLIENT api base")
        // Redirect to clientRouter
        clientRouter(req, res, next);
    } else {
        // Invalid MsgType
        res.status(400).json({ error: 'Invalid MsgType' });
    }
});

const PORT = process.env.PORT || 2000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
