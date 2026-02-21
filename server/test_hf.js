const axios = require('axios');
async function test() {
    try {
        const res = await axios.post('https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.3', {
            inputs: 'Hello'
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.HF_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        console.log('SUCCESS:', res.data);
    } catch (err) {
        console.error('ERROR:', err.message);
    }
}
test();
