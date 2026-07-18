const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Setup data persistence path
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'reviews.json');

// Prepopulated reviews to give the app a polished look right out of the box
const DEFAULT_REVIEWS = [
  {
    id: 'rev-1',
    week: 1,
    reviewer: 'Aarav Sharma',
    rating: 5,
    review: 'React Fundamentals (1/2) was an amazing introduction. Setting up the Vite environment was straightforward and the concepts of components and props were explained very clearly. Managing state using the useState hook is satisfying.',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    helpfulCount: 3,
    tags: ['Clarity', 'Support']
  },
  {
    id: 'rev-2',
    week: 2,
    reviewer: 'Priya Patel',
    rating: 4,
    review: 'React Fundamentals (2/2) was excellent. The dashboard mini-project was challenging, especially managing data fetching with useEffect, but it really helped solidify my state and props understanding.',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    helpfulCount: 5,
    tags: ['Complexity', 'Workload']
  },
  {
    id: 'rev-3',
    week: 3,
    reviewer: 'Amit Verma',
    rating: 4,
    review: 'Core Logic and TypeScript. Learning TS interfaces and types caught multiple bugs early. The HTML5 canvas drawing and requestAnimationFrame loops made the game animations very engaging.',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    helpfulCount: 1,
    tags: ['Complexity', 'Clarity']
  },
  {
    id: 'rev-4',
    week: 6,
    reviewer: 'Rohan Gupta',
    rating: 5,
    review: 'Advanced Version Control and DevOps. Docker containerization solved the "works on my machine" issue completely. Writing Dockerfiles for both frontend and backend helped resolve the environment isolation issues.',
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    helpfulCount: 8,
    tags: ['Clarity', 'Workload']
  },
  {
    id: 'rev-5',
    week: 7,
    reviewer: 'Divya Iyer',
    rating: 4,
    review: 'Deployment Strategies. Setting up the automated CI/CD pipeline with GitHub Actions was fantastic. Seeing the full-stack application deployed live on the web made all the hard work worth it!',
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    helpfulCount: 2,
    tags: ['Support', 'Pacing']
  }
];

// Helper to ensure database file exists
const initDatabase = () => {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify(DEFAULT_REVIEWS, null, 2), 'utf8');
      console.log('Database initialized with default reviews.');
    }
  } catch (err) {
    console.error('Error initializing database:', err);
  }
};

// Helper to read reviews
const readReviews = () => {
  try {
    initDatabase();
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data || '[]');
  } catch (err) {
    console.error('Error reading database file:', err);
    return [];
  }
};

// Helper to write reviews
const writeReviews = (reviews) => {
  try {
    initDatabase();
    fs.writeFileSync(DATA_FILE, JSON.stringify(reviews, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error writing to database file:', err);
    return false;
  }
};

// --- Endpoints ---

// Get all reviews
app.get('/api/reviews', (req, res) => {
  const reviews = readReviews();
  res.json(reviews);
});

// Add a new review
app.post('/api/reviews', (req, res) => {
  const { week, reviewer, rating, review, tags } = req.body;

  const parsedWeek = parseInt(week, 10);
  const parsedRating = parseInt(rating, 10);

  // Validation
  if (isNaN(parsedWeek) || parsedWeek < 1 || parsedWeek > 7) {
    return res.status(400).json({ error: 'Week must be between 1 and 7.' });
  }
  if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
    return res.status(400).json({ error: 'Rating must be between 1 and 5.' });
  }
  if (!review || review.trim().length < 10) {
    return res.status(400).json({ error: 'Review must be at least 10 characters long.' });
  }

  // Sanitize tags (only keep valid ones)
  const allowedTags = ['Workload', 'Support', 'Complexity', 'Pacing', 'Clarity'];
  const sanitizedTags = Array.isArray(tags) 
    ? tags.filter(tag => allowedTags.includes(tag))
    : [];

  const reviews = readReviews();
  const newReview = {
    id: `rev-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    week: parsedWeek,
    reviewer: reviewer ? reviewer.trim() : 'Anonymous',
    rating: parsedRating,
    review: review.trim(),
    createdAt: new Date().toISOString(),
    helpfulCount: 0,
    tags: sanitizedTags
  };

  reviews.unshift(newReview); // Put newest reviews at the top by default
  if (writeReviews(reviews)) {
    res.status(201).json(newReview);
  } else {
    res.status(500).json({ error: 'Could not save review.' });
  }
});

// Upvote a review (increment helpfulCount)
app.post('/api/reviews/:id/helpful', (req, res) => {
  const { id } = req.params;
  const reviews = readReviews();
  const index = reviews.findIndex(r => r.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Review not found.' });
  }

  if (typeof reviews[index].helpfulCount !== 'number') {
    reviews[index].helpfulCount = 0;
  }

  reviews[index].helpfulCount += 1;

  if (writeReviews(reviews)) {
    res.json({ id: reviews[index].id, helpfulCount: reviews[index].helpfulCount });
  } else {
    res.status(500).json({ error: 'Could not update helpful count.' });
  }
});

// Delete a review
app.delete('/api/reviews/:id', (req, res) => {
  const { id } = req.params;
  const reviews = readReviews();
  const index = reviews.findIndex(r => r.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Review not found.' });
  }

  reviews.splice(index, 1);
  if (writeReviews(reviews)) {
    res.json({ message: 'Review deleted successfully.' });
  } else {
    res.status(500).json({ error: 'Could not delete review.' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', database: fs.existsSync(DATA_FILE) });
});

// Start listening
app.listen(PORT, () => {
  console.log(`Backend server is running on port ${PORT}`);
  initDatabase();
});
