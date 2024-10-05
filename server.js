const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const bcrypt = require('bcrypt');

const port = 3000;

const app = express();

// Middleware
app.use(express.static(__dirname));
app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // Add this to parse JSON requests

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/login', { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;

db.once('open', () => {
    console.log('Connected to MongoDB');
});

// User schema
const userSchema = new mongoose.Schema({
    Username: String,
    password: String,
    email: String,
});

const User = mongoose.model('User', userSchema);

// Serve the registration page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Registration endpoint
app.post('/register', async (req, res) => {
    try {
        const existingUser = await User.findOne({ email: req.body.email });
        if (existingUser) {
            return res.status(400).json({ message: "Email already exists" });
        }

        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        const newUser = new User({
            Username: req.body.Username,
            password: hashedPassword,
            email: req.body.email,
        });

        await newUser.save();
        console.log('User saved');

        // Send a success message as a JSON response and redirect to login page
        res.status(201).json({ message: 'User created successfully!' }).redirect('/login.html');
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
});

// Serve login page
app.get('/login.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

// Login endpoint
app.post('/login', async (req, res) => {
    try {
        // Validate user input
        const {username, password} = req.body;
        const finduser = await User.findOne({ username: req.body.username });
        if (!finduser) {
            return res.status(401).json({ message: "Invalid username or password" });
        }

        // Check if the password is valid
        const validPassword = await bcrypt.compare(password, finduser.password);

        if (validPassword) {
            // Send a success message as a JSON response and redirect to homepage
            res.status(200).json({ message: "Login successful!" }).redirect('/');
        } else {
            return res.status(401).json({ message: "Invalid username or password" });
        }
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: "Something went wrong, please try again." });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});