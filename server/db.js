const { Kafka } = require('kafkajs')
const fs = require('fs')
const path = require('path')

const kafka = new Kafka({
    clientId: 'kodbank-app',
    brokers: ['kafka-3a844d58-uzefzardoz-9c0f.j.aivencloud.com:17341'],
    ssl: {
        ca: [fs.readFileSync(path.join(__dirname, 'ca.pem'), 'utf-8')],
        key: fs.readFileSync(path.join(__dirname, 'service.key'), 'utf-8'),
        cert: fs.readFileSync(path.join(__dirname, 'service.cert'), 'utf-8'),
    },
    connectionTimeout: 10000,
    authenticationTimeout: 10000
})

// Store our data in memory since Kafka is just a message broker
const db = {
    KodUser: [],
    UserToken: []
};

const producer = kafka.producer()
const consumer = kafka.consumer({ groupId: 'kodbank-group' })

async function initKafka() {
    try {
        const admin = kafka.admin()
        await admin.connect()
        // Create topics if they don't exist
        await admin.createTopics({
            topics: [
                { topic: 'koduser_topic', numPartitions: 1 },
                { topic: 'usertoken_topic', numPartitions: 1 }
            ]
        })
        await admin.disconnect()

        await producer.connect()
        console.log('Kafka Producer connected')

        await consumer.connect()
        console.log('Kafka Consumer connected')

        // We use two topics one for users and one for tokens
        await consumer.subscribe({ topic: 'koduser_topic', fromBeginning: true })
        await consumer.subscribe({ topic: 'usertoken_topic', fromBeginning: true })

        await consumer.run({
            eachMessage: async ({ topic, partition, message }) => {
                const data = JSON.parse(message.value.toString());
                if (topic === 'koduser_topic') {
                    // Check if it already exists and update, or push
                    const index = db.KodUser.findIndex(u => u.uid === data.uid);
                    if (index > -1) {
                        db.KodUser[index] = data;
                    } else {
                        db.KodUser.push(data)
                    }
                } else if (topic === 'usertoken_topic') {
                    // Check if token exists and update (or delete logic if token is empty), or push
                    const index = db.UserToken.findIndex(t => t.token === data.token);
                    if (data.action === 'delete') {
                        if (index > -1) db.UserToken.splice(index, 1);
                    } else {
                        if (index > -1) {
                            db.UserToken[index] = data;
                        } else {
                            db.UserToken.push(data);
                        }
                    }
                }
            },
        })
    } catch (e) {
        console.error('Kafka connection error', e)
    }
}

// Call but don't crash the server if it fails
initKafka().catch(console.error);

module.exports = { producer, db }
