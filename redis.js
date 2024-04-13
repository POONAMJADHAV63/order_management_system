const redis = require('redis');
const client = redis.createClient();

function setValue(key, value) {
    client.set(key, value, function(err, reply) {
        if (err) {
            console.error('Error setting value:', err);
        } else {
            console.log('Value set successfully');
        }
    });
}


function getValue(key, callback) {
    client.get(key, callback);
}

module.exports = {
    setValue,
    getValue
};
