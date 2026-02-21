const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const axios = require('axios');
const { producer, db } = require('./db');

const app = express();
const PORT = 5000;
const SECRET_KEY = 'kodbank_super_secret_key_123'; // Hardcoded for simplicity

// Middleware
app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:5174'], credentials: true })); // Allow Vite React client
app.use(express.json());
app.use(cookieParser());

// Helper function to produce messages to Kafka
const produceMessage = async (topic, message) => {
    try {
        await producer.send({
            topic: topic,
            messages: [
                { value: JSON.stringify(message) },
            ],
        });
    } catch (e) {
        console.error('Error producing message:', e);
        throw e;
    }
}

// Routes
app.post('/api/register', async (req, res) => {
    try {
        const { uid, username, password, email, phone, role = 'Customer' } = req.body;

        if (!uid || !username || !password || !email || !phone) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Check if user exists in our in-memory cache
        const existingUser = db.KodUser.find(u => u.username === username || u.uid === uid);
        if (existingUser) {
            return res.status(400).json({ error: 'Username or UID might already exist' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = {
            uid,
            username,
            password: hashedPassword,
            email,
            phone,
            role,
            balance: 100000.0 // Default initial balance
        };

        // Send to Kafka
        await produceMessage('koduser_topic', newUser);

        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password required' });
        }

        // Get user from in-memory cache
        const user = db.KodUser.find(u => u.username === username);
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate JWT
        const token = jwt.sign({ username: user.username, role: user.role, uid: user.uid }, SECRET_KEY, { expiresIn: '1h' });

        // Calculate expairy
        const expairyDate = new Date(Date.now() + 3600000).toISOString();

        const tokenData = {
            token,
            uid: user.uid,
            expairy: expairyDate,
            tid: Date.now() // Mock TID
        };

        // Send token to Kafka
        await produceMessage('usertoken_topic', tokenData);

        // Add token as cookie
        res.cookie('token', token, {
            httpOnly: true, // Secure in a real app
            secure: false, // For localhost
            sameSite: 'lax',
            maxAge: 3600000 // 1 hour
        });

        res.status(200).json({ message: 'Login successful', username: user.username });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/balance', async (req, res) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({ error: 'Unauthorized: No token provided' });
        }

        // Verify JWT
        const decoded = jwt.verify(token, SECRET_KEY);
        const uid = decoded.uid;

        // Verify token in cache
        const tokenEntry = db.UserToken.find(t => t.token === token && t.uid === uid);
        if (!tokenEntry) {
            return res.status(401).json({ error: 'Unauthorized: Token invalid or expired in DB' });
        }

        if (new Date(tokenEntry.expairy) < new Date()) {
            return res.status(401).json({ error: 'Unauthorized: Token expired in DB' });
        }

        // Fetch balance from cache
        const user = db.KodUser.find(u => u.uid === uid);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json({ message: 'Success', balance: user.balance });
    } catch (error) {
        console.error('Balance check error:', error);
        return res.status(403).json({ error: 'Forbidden: Invalid or expired token' });
    }
});

app.post('/api/chat', async (req, res) => {
    try {
        const { message } = req.body;
        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        const hfResponse = await axios.post('https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.3', {
            inputs: message
        }, {
            headers: {
                'Authorization': `Bearer ${process.env.HF_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        let generatedText = hfResponse.data[0]?.generated_text || "I'm sorry, I couldn't process your request.";

        // Strip out the input prompt from the output
        if (generatedText.startsWith(message)) {
            generatedText = generatedText.slice(message.length).trim();
        }

        res.status(200).json({ response: generatedText });

    } catch (error) {
        console.error('Chat error:', error);
        res.status(500).json({ error: 'Internal server error during chat' });
    }
});

app.post('/api/logout', async (req, res) => {
    try {
        const token = req.cookies.token;
        if (token) {
            // Remove token by sending a delete action to Kafka
            await produceMessage('usertoken_topic', { token: token, action: 'delete' });
        }
        res.clearCookie('token');
        res.status(200).json({ message: 'Logout successful' });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
