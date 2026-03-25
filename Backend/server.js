require('dotenv').config();
const express = require('express');
const cors = require('cors');
const passport = require('passport');
const session = require('express-session');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const connectDB = require('./config/database');
const authRoutes = require('./routes/auth');
const searchRoutes = require('./routes/search');

const app = express();

// Connect to database
connectDB();

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware
app.use(session({
  secret: process.env.JWT_SECRET || 'fallback-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000
  }
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Google OAuth Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: `${process.env.BACKEND_URL || 'http://localhost:5000'}/auth/google/callback`
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const User = require('./models/User');
    
    // 1. Check if user already has this Google account linked
    let user = await User.findOne({ googleId: profile.id });
    
    if (user) {
      return done(null, user);
    } 

    // 2. Check if user already exists with this email but no Google ID linked
    const userEmail = profile.emails && profile.emails.length > 0 ? profile.emails[0].value : null;
    
    if (userEmail) {
      user = await User.findOne({ email: userEmail });
      
      if (user) {
        // Link Google ID to existing user account
        user.googleId = profile.id;
        if (!user.avatar && profile.photos && profile.photos.length > 0) {
          user.avatar = profile.photos[0].value;
        }
        await user.save();
        return done(null, user);
      }
    }

    // 3. Create new user if not found
    user = new User({
      name: profile.displayName || 'Google User',
      email: userEmail,
      googleId: profile.id,
      avatar: profile.photos && profile.photos.length > 0 ? profile.photos[0].value : ''
    });
    
    await user.save();
    return done(null, user);
  } catch (error) {
    console.error('Passport Google Strategy Error:', error);
    return done(error, null);
  }
}));

// Serialize/deserialize user
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const User = require('./models/User');
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Routes

app.get("/", (req, res) => {
  res.send("🚀 Backend is running successfully");
});

app.use('/api/auth', authRoutes);
app.use('/api/search', searchRoutes);

// Google OAuth routes
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/auth/google/callback',
  passport.authenticate('google', { 
    failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=oauth_failed` 
  }),
  (req, res) => {
    const { generateToken } = require('./utils/jwtUtils');
    const token = generateToken(req.user._id);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}?token=${token}`);
  }
);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running', port: PORT });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use.`);
    console.log('Kill the process using the port and restart.');
    process.exit(1);
  } else {
    console.error('Server error:', err);
    process.exit(1);
  }
});
