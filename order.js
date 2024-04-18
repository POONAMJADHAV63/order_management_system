const express = require('express');
const redis = require('ioredis');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();
const redisClient = new redis();


// API endpoint for handling order operations
router.post('/app', (req, res) => {
    const { MsgType, OperationType, TenantId, OMSId, OrderType, OrderId, Token, OrderPrice, OrderQty, ClientId, ClientName } = req.body;

    switch (OperationType) {
        case 100:
            console.log("I AM IN ORDER ROUTE")
            addOrder(MsgType, OperationType, TenantId, OMSId, OrderType, OrderId, Token, OrderPrice, OrderQty, ClientId, ClientName, res);
            break;
        case 101:
            updateOrder(MsgType, OperationType, TenantId, OMSId, OrderType, OrderId, Token, OrderPrice, OrderQty, ClientId, ClientName, res);
            break;
        case 102:
            deleteOrder(OperationType, TenantId, OMSId, Token, res);
            break;
        case 103:
            getOrder(OperationType, TenantId, OMSId, Token, res);
            break;
        case 104:
            getAllOrders(res);
            break;
        default:
            res.status(400).json({ message: 'Invalid OperationType' });
    }
});

// Function to add an order
function addOrder(MsgType, OperationType, TenantId, OMSId, OrderType, OrderId, Token, OrderPrice, OrderQty, ClientId, ClientName, res) {
    const orderKey = `order:${TenantId}:${OMSId}:${Token}`;
    const orderData = { MsgType, OperationType, TenantId, OMSId, OrderType, OrderId, Token, OrderPrice, OrderQty, ClientId, ClientName };

    redisClient.set(orderKey, JSON.stringify(orderData), (err) => {
        if (err) {
            console.error('Error storing order in Redis:', err);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
        res.json({ message: 'Order added successfully', OrderId });
    });
}

// Function to update an order
function updateOrder(MsgType, OperationType, TenantId, OMSId, OrderType, OrderId, Token, OrderPrice, OrderQty, ClientId, ClientName, res) {
    const key = `order:${TenantId}:${OMSId}:${Token}`;

    redisClient.get(key, (err, orderData) => {
        if (err) {
            console.error('Error retrieving order from Redis:', err);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
        if (!orderData) {
            return res.status(404).json({ error: 'Order not found' });
        }

        const existingOrder = JSON.parse(orderData);

        existingOrder.MsgType = MsgType;
        existingOrder.OperationType = OperationType;
        existingOrder.OrderType = OrderType;
        existingOrder.OrderId = OrderId;
        existingOrder.OrderPrice = OrderPrice;
        existingOrder.OrderQty = OrderQty;
        existingOrder.ClientId = ClientId;
        existingOrder.ClientName = ClientName;

        redisClient.set(key, JSON.stringify(existingOrder), (err) => {
            if (err) {
                console.error('Error updating order in Redis:', err);
                return res.status(500).json({ error: 'Internal Server Error' });
            }
            res.json({ message: 'Order updated successfully', OrderId });
        });
    });
}

// Function to delete an order
function deleteOrder(OperationType, TenantId, OMSId, Token, res) {
    const key = `order:${TenantId}:${OMSId}:${Token}`;
    redisClient.del(key, (err, reply) => {
        if (err) {
            console.error("Error deleting order from Redis:", err);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
        if (reply === 0) {
            console.log("Order not found in Redis");
            return res.status(404).json({ error: 'Order not found' });
        }
        res.json({ message: 'Order deleted successfully' });
    });
}

// Function to retrieve an order
function getOrder(OperationType, TenantId, OMSId, Token, res) {
    const key = `order:${TenantId}:${OMSId}:${Token}`;
    redisClient.get(key, (err, orderData) => {
        if (err) {
            console.error('Error retrieving order from Redis:', err);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
        if (!orderData) {
            return res.status(404).json({ error: 'Order not found' });
        }
        res.json(JSON.parse(orderData));
    });
}

// Function to retrieve all orders
function getAllOrders(res) {
    redisClient.keys('order:*', (err, keys) => {
        if (err) {
            console.error('Redis error:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
        if (!keys || keys.length === 0) {
            return res.status(404).json({ error: 'No records found' });
        }
        const getAllDataPromises = keys.map(key => {
            return new Promise((resolve, reject) => {
                redisClient.get(key, (err, data) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(JSON.parse(data));
                    }
                });
            });
        });
        Promise.all(getAllDataPromises)
            .then(results => {
                res.json(results);
            })
            .catch(err => {
                console.error('Redis error:', err);
                res.status(500).json({ error: 'Internal server error' });
            });
    });
}

module.exports = router;
