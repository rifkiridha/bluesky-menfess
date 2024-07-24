const express = require('express');
const { Pool } = require('pg');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');
const { BskyAgent } = require('@atproto/api'); // Import BskyAgent from @atproto/api

const app = express();
const port = 80;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../public')));

// PostgreSQL connection
const pool = new Pool({
    user: 'postgres',
    host: 'database-1.cn80yqsiyae5.us-west-2.rds.amazonaws.com',
    database: 'unandfess',
    password: 'postgres',
    port: 5432,
    ssl: {
        rejectUnauthorized: false
    }
});

// Initialize BskyAgent
const agent = new BskyAgent({
    service: 'https://bsky.social'
});

// Middleware to verify token
const verifyToken = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) {
        return res.status(403).send('Token is required');
    }

    jwt.verify(token, 'your_jwt_secret', (err, decoded) => {
        if (err) {
            console.error('Token verification error:', err.message);
            return res.status(403).send('Invalid token');
        }
        req.user = decoded;
        next();
    });
};

// Register user
app.post('/register', async (req, res) => {
    const { username, password, role } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    const sql = 'INSERT INTO users (username, password, role) VALUES ($1, $2, $3)';
    pool.query(sql, [username, hashedPassword, role], (err) => {
        if (err) {
            console.error('Database error:', err.message);
            return res.status(500).send('Failed to register user');
        }
        res.status(201).send('User registered');
    });
});

// Login user
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    const sql = 'SELECT * FROM users WHERE username = $1';
    pool.query(sql, [username], async (err, result) => {
        if (err) {
            console.error('Database error:', err.message);
            return res.status(500).send('Server error');
        }
        if (result.rows.length === 0) {
            return res.status(400).send('User not found');
        }

        const user = result.rows[0];
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(400).send('Invalid password');
        }

        const token = jwt.sign({ id: user.id, role: user.role }, 'your_jwt_secret', { expiresIn: '1h' });
        res.json({ token });
    });
});

// Edit username or password
app.put('/edit', verifyToken, async (req, res) => {
    const { username, password } = req.body;
    const userId = req.user.id;

    const updates = [];
    const values = [];

    if (username) {
        updates.push('username = $1');
        values.push(username);
    }

    if (password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        updates.push('password = $2');
        values.push(hashedPassword);
    }

    if (updates.length === 0) {
        return res.status(400).send('No updates provided');
    }

    values.push(userId);
    const sql = `UPDATE users SET ${updates.join(', ')} WHERE id = $${values.length}`;

    pool.query(sql, values, (err) => {
        if (err) {
            console.error('Database error:', err.message);
            return res.status(500).send('Failed to update user');
        }
        res.send('User updated');
    });
});

// Delete user
app.delete('/delete', verifyToken, (req, res) => {
    const userIdToDelete = req.body.userId;
    const decoded = req.user;

    if (decoded.role !== 'admin' && userIdToDelete !== decoded.id.toString()) {
        return res.status(403).send('Unauthorized to delete this user');
    }

    const sql = 'DELETE FROM users WHERE id = $1';
    pool.query(sql, [userIdToDelete], (err, result) => {
        if (err) {
            console.error('Database error:', err.message);
            return res.status(500).send('Failed to delete user');
        }
        if (result.rowCount === 0) {
            return res.status(404).send('User not found');
        }
        res.send('User deleted');
    });
});

// Create message with "uaf!" trigger
app.post('/messages', verifyToken, async (req, res) => {
    const { message } = req.body;
    const userId = req.user.id;

    // Check if message contains "uaf!" (case insensitive)
    if (!message || !message.match(/uaf!/i)) {
        return res.status(400).send('Message must contain "uaf!" (case insensitive)');
    }

    // Fetch username based on user_id
    const getUserSql = 'SELECT username FROM users WHERE id = $1';
    pool.query(getUserSql, [userId], async (err, result) => {
        if (err) {
            console.error('Database error:', err.message);
            return res.status(500).send('Failed to create message');
        }
        if (result.rows.length === 0) {
            return res.status(404).send('User not found');
        }

        const username = result.rows[0].username;

        // Insert message into messages table
        const insertMessageSql = 'INSERT INTO messages (user_id, username, message, status, created_at) VALUES ($1, $2, $3, $4, NOW())';
        const values = [userId, username, message, 'sent'];

        pool.query(insertMessageSql, values, async (err) => {
            if (err) {
                console.error('Database error:', err.message);
                return res.status(500).send('Failed to create message');
            }

            // Post to Bsky
            try {
                await agent.login({
                    identifier: 'unandfess.bsky.social',
                    password: 'deltagear'
                });

                await agent.post({
                    text: message,
                    createdAt: new Date().toISOString()
                });

                console.log('Post created successfully!');
                res.status(201).send('Message created and posted to Bsky');
            } catch (error) {
                console.error('Error creating post:', error);
                res.status(500).send('Failed to post message to Bsky');
            }
        });
    });
});

// Get messages (for authenticated user)
app.get('/messages', verifyToken, (req, res) => {
    const userId = req.user.id;
    const userRole = req.user.role;

    if (userRole === 'admin') {
        const sql = 'SELECT * FROM messages';
        pool.query(sql, (err, result) => {
            if (err) {
                console.error('Database error:', err.message);
                return res.status(500).send('Failed to fetch messages');
            }
            res.json(result.rows);
        });
    } else {
        const sql = 'SELECT * FROM messages WHERE user_id = $1';
        pool.query(sql, [userId], (err, result) => {
            if (err) {
                console.error('Database error:', err.message);
                return res.status(500).send('Failed to fetch messages');
            }
            res.json(result.rows);
        });
    }
});

// Delete message (set status to "deleted") for authenticated user
app.delete('/messages/:messageId', verifyToken, (req, res) => {
    const { messageId } = req.params;
    const userId = req.user.id;

    const sql = 'UPDATE messages SET status = $1 WHERE id = $2 AND user_id = $3';
    pool.query(sql, ['deleted', messageId, userId], (err, result) => {
        if (err) {
            console.error('Database error:', err.message);
            return res.status(500).send('Failed to delete message');
        }
        if (result.rowCount === 0) {
            return res.status(404).send('Message not found');
        }
        res.send('Message deleted');
    });
});

// Admin delete any message
app.delete('/messages/admin/:messageId', verifyToken, (req, res) => {
    const { messageId } = req.params;

    const sql = 'DELETE FROM messages WHERE id = $1';
    pool.query(sql, [messageId], (err, result) => {
        if (err) {
            console.error('Database error:', err.message);
            return res.status(500).send('Failed to delete message');
        }
        if (result.rowCount === 0) {
            return res.status(404).send('Message not found');
        }
        res.send('Message deleted');
    });
});

// Get all users (admin only)
app.get('/users', verifyToken, (req, res) => {
    const decoded = req.user;

    if (decoded.role !== 'admin') {
        return res.status(403).send('Access denied');
    }

    const sql = 'SELECT id, username, role FROM users';
    pool.query(sql, (err, result) => {
        if (err) {
            console.error('Database error:', err.message);
            return res.status(500).send('Failed to fetch users');
        }
        res.json(result.rows);
    });
});

// Route handler for root URL
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});