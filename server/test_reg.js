const axios = require('axios');
axios.post('http://localhost:5000/api/register', {
    uid: 'u123',
    username: 'testu1',
    password: 'password123',
    email: 'test@example.com',
    phone: '1234567890'
}).then(res => console.log('SUCCESS:', res.data))
    .catch(err => console.error('ERROR:', err.response ? err.response.data : err.message));
