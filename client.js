const express = require('express');
const redis = require('ioredis');

const app = express();
app.use(express.json());

const redisClient = new redis();

// Function to validate ClientInfo
function validateClientInfo(clientInfo) {
    if (!clientInfo || typeof clientInfo !== 'object') {
        return false;
    }
    const requiredFields = ['MsgType', 'OperationType', 'TenantId', 'OSMId', 'ClientId', 'ClientName'];
    return requiredFields.every(field => clientInfo.hasOwnProperty(field));
}

// API endpoint for handling client operations
app.post('/client-operation', (req, res) => {
    const { MsgType, OperationType, TenantId, OSMId, ClientId, ClientName } = req.body;
    const body=req.body;
    if (!validateClientInfo(req.body)) {
        return res.status(400).json({ error: 'Invalid client information' });
    }

    switch (OperationType) {
        case 100:
            addClient(MsgType,TenantId, OSMId, ClientId, ClientName,OperationType, res);
            break;
        case 101:
            updateClient(TenantId, OSMId, ClientId, ClientName,body,OperationType, res);
            break;
        case 102:
            deleteClient(OperationType,TenantId, OSMId, ClientId, res);
            break;
        case 103:
            getClient(OperationType,TenantId, OSMId, ClientId, res);
            break;
        case 104:
            getAllClients(res);
            break;
        default:
            res.status(400).json({ message: 'Invalid OperationType' });
    }
});

// Function to add a client
function addClient(MsgType,TenantId, OSMId, ClientId, ClientName,OperationType, res) {
    // Implementation for adding a client
    const key = `${TenantId}_${OSMId}_${ClientId}`;
    redisClient.exists(key, (err, exists) => {
        if (err) {
            return res.status(500).json({ error: 'Internal Server Error' });
        }
        if (exists) {
            return res.status(409).json({ error: 'Client already exists' });
        }

        const clientInfo = {
            MsgType,
            OperationType,
            TenantId,
            OSMId,
            ClientId,
            ClientName
        };

        redisClient.set(key, JSON.stringify(clientInfo), (err) => {
            if (err) {
                return res.status(500).json({ error: 'Internal Server Error' });
            }
            res.json({ message: 'Client added successfully' });
        });
    });
}

// Function to update a client
function updateClient(TenantId, OSMId, ClientId, NewClientName,body,OperationType, res) {
    const key = `${TenantId}_${OSMId}_${ClientId}`; // Constructing the key

    redisClient.exists(key, (err, exists) => {
        if (err) {
            return res.status(500).json({ error: 'Internal Server Error' });
        }
        if (!exists) {
            return res.status(404).json({ error: 'Client not found' });
        }

        redisClient.set(key, body, (err) => {
            if (err) {
                return res.status(500).json({ error: 'Internal Server Error' });
            }
            res.json({ message: 'Client updated successfully' });
        });
    });
}

// Function to delete a client
function deleteClient(OperationType,TenantId, OSMId, ClientId, res) {
    const key = `${TenantId}_${OSMId}_${ClientId}`;
    redisClient.del(key, (err, reply) => {
        if (err) {
            return res.status(500).json({ error: 'Internal Server Error' });
        }
        if (reply === 0) {
            return res.status(404).json({ error: 'Client not found' });
        }
        res.json({ message: 'Client deleted successfully' });
    });
}

// Function to get a particular client based on ClientId
function getClient(OperationType, TenantId, OSMId, ClientId, res) {
    const key = `${TenantId}_${OSMId}_${ClientId}`;
    redisClient.get(key, (err, reply) => {
        if (err) {
            return res.status(500).json({ error: 'Internal Server Error' });
        }
        const clientInfo = JSON.parse(reply);
        res.json(clientInfo);
    });
}

// Function to get all clients
function getAllClients(res) {
    redisClient.keys('*', (err, keys) => {
        if (err) {
            return res.status(500).json({ error: 'Internal Server Error' });
        }
        if (keys.length === 0) {
            return res.json([]);
        }
        const fetchClientPromises = keys.map(key => {
            return new Promise((resolve, reject) => {
                redisClient.get(key, (err, reply) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(JSON.parse(reply));
                    }
                });
            });
        });

        Promise.all(fetchClientPromises)
            .then(clients => {
                res.json(clients);
            })
            .catch(err => {
                res.status(500).json({ error: 'Internal Server Error' });
            });
    });
}

const PORT = process.env.PORT || 2000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
