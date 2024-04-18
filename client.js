const express = require('express');
const redis = require('ioredis');
const router = express.Router();

const redisClient = new redis();

// API endpoint for handling client operations
router.post('/app', (req, res) => {
    const { MsgType, OperationType, TenantId, OSMId, ClientId, ClientName } = req.body;
    const body = req.body;

    switch (OperationType) {
        case 100:
            console.log("add client operations")
            addClient(MsgType, TenantId, OSMId, ClientId, ClientName, OperationType, res);
            break;
        case 101:
            updateClient(TenantId, OSMId, ClientId, ClientName, body, OperationType, res);
            break;
        case 102:
            deleteClient(OperationType, TenantId, OSMId, ClientId, res);
            break;
        case 103:
            getClient(OperationType, TenantId, OSMId, ClientId, res);
            break;
        case 104:
            getAllClients(res);
            break;
        default:
            res.status(400).json({ message: 'Invalid OperationType' });
    }
});

// Function to add a client
async function addClient(MsgType, TenantId, OSMId, ClientId, ClientName, OperationType, res) {
    // Implementation for adding a client
 
    const key = `${TenantId}_${OSMId}_${ClientId}`;
     
    await redisClient.exists(key, (err, exists) => {
        if (err) {
            return res.status(500).json({ error: 'Internal Server Error' });
        }
        if (exists) {
            return res.status(409).json({ error: 'Client already exists' });
        }
    })

        const clientInfo = {
            MsgType,
            OperationType,
            TenantId,
            OSMId,
            ClientId,
            ClientName
        };

    const id = ClientId
    const value = JSON.stringify(clientInfo)
    const data =  await redisClient.hset(key, id,value) 
       
    if (data) {
        await redisClient.sadd("clientDetails", key);
        res.status(200).json({ message: clientInfo });
        return data;
      }
       
      
    }
   
 

// Function to update a client
function updateClient(TenantId, OSMId, ClientId, NewClientName, body, OperationType, res) {
    const key = `${TenantId}_${OSMId}_${ClientId}`; // Constructing the key

    redisClient.exists(key, (err, exists) => {
        if (err) {
            return res.status(500).json({ error: 'Internal Server Error' });
        }
        if (!exists) {
            return res.status(404).json({ error: 'Client not found' });
        }

        redisClient.set(key, JSON.stringify(body), (err) => {
            if (err) {
                return res.status(500).json({ error: 'Internal Server Error' });
            }
            res.json({ message: 'Client updated successfully' });
        });
    });
}

// Function to delete a client
function deleteClient(OperationType, TenantId, OSMId, ClientId, res) {
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

        // Check if reply is null or undefined
        if (!reply) {
            return res.status(404).json({ error: 'Client not found' });
        }

        let clientInfo;
        try {
            clientInfo = JSON.parse(reply);
        } catch (e) {
            console.error('Error parsing JSON:', e);
            return res.status(500).json({ error: 'Error parsing JSON data' });
        }

        res.json(clientInfo);
    });
}

// Function to get all clients
async function getAllClients(res) {
 
    const hashdata = await redisClient.smembers("clientDetails");
    let data = [];
console.log({hashdata})
    await Promise.all(
      hashdata.map(async (element) => {
        let hashData = await redisClient.hgetall(element);
        hashData = JSON.parse(JSON.stringify(hashData));
        for (var key in hashData) {
          hashData[key] = data.push(JSON.parse(hashData[key]));
        }
      })
    );
    res.json(data);
    return data; 
}

module.exports = router;
