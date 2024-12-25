// index.js
const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const cors = require('cors'); // Import CORS
const userRoutes = require('./routes/routes');

// Initialize environment variables
dotenv.config();

const app = express();

// Enable CORS for all routes (allow all origins)
app.use(cors());

// OR Enable CORS for specific origin (e.g., only allow requests from localhost:3001)
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'], // Allow both origins
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allow specific HTTP methods
  allowedHeaders: ['Content-Type', 'Authorization'], // Allow specific headers
}));


app.use(bodyParser.json());

// Static folder for accessing uploaded images
app.use('/images', express.static('public/images'));

// Routes
app.use('/api', userRoutes);

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
