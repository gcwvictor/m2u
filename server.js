const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const MongoStore = require('connect-mongo');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('MongoDB connected...');
}).catch((err) => {
  console.error('MongoDB connection error:', err);
});

// Define schemas and models
const userSchema = new mongoose.Schema({
  username: String,
  password: String,
});

const jkmSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  tanggal: String,
  unit_mesin: String,
  jkm_harian: Number,
  jumlah_jkm_har: Number,
  jsmo: Number,
  jsb: Number,
  keterangan: String,
});

const gangguanSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  tanggal: String,
  nama_gangguan: String,
  unit_mesin: String,
  foto: String,
});

// Check if models already exist to prevent OverwriteModelError
const User = mongoose.models.User || mongoose.model('User', userSchema);
const JkmData = mongoose.models.JkmData || mongoose.model('JkmData', jkmSchema);
const GangguanData = mongoose.models.GangguanData || mongoose.model('GangguanData', gangguanSchema);

// Middleware
app.use(bodyParser.json({ limit: '16mb', extended: true })); 
app.use(bodyParser.urlencoded({ limit: '16mb', extended: true }));
app.use('/static', express.static(path.join(__dirname, 'static')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use(express.static(path.join(__dirname, 'views')));

// Session management
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI })
}));

app.use(passport.initialize());
app.use(passport.session());

// Passport configuration
passport.use(new LocalStrategy(async (username, password, done) => {
  try {
    const user = await User.findOne({ username });
    if (!user) {
      return done(null, false, { message: 'Incorrect username.' });
    }
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return done(null, false, { message: 'Incorrect password.' });
    }
    return done(null, user);
  } catch (err) {
    return done(err);
  }
}));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

// Set up multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Authentication middleware
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/');
}

// Endpoints
// User registration
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = new User({ username, password: hashedPassword });
  try {
    await user.save();
    res.redirect('/');
  } catch (err) {
    res.status(400).send('Error registering user');
  }
});

// User login
app.post('/login', passport.authenticate('local', {
  successRedirect: '/menu.html',
  failureRedirect: '/',
  failureFlash: false
}));

// User logout
app.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.redirect('/');
  });
});

// JKM Harian CRUD
app.post('/saveJkmData', ensureAuthenticated, async (req, res) => {
  const data = new JkmData({ ...req.body, user: req.user._id });
  try {
    await data.save();
    res.status(201).json(data); // Return the saved data
  } catch (err) {
    console.error(err);
    res.status(400).send('Error saving data');
  }
});

app.get('/getJkmData', ensureAuthenticated, async (req, res) => {
  try {
    const results = await JkmData.find({ user: req.user._id, unit_mesin: req.query.unit_mesin });
    res.status(200).json(results);
  } catch (err) {
    console.error(err);
    res.status(400).send('Error fetching data');
  }
});

app.delete('/deleteJkmData/:id', ensureAuthenticated, async (req, res) => {
  try {
    await JkmData.findByIdAndDelete(req.params.id);
    res.status(200).send('Data deleted');
  } catch (err) {
    console.error(err);
    res.status(400).send('Error deleting data');
  }
});

async function uploadImageToImgur(imageBase64) {
  try {
      const response = await axios.post('https://api.imgur.com/3/upload', {
          image: imageBase64,
          type: 'base64',
      }, {
          headers: {
              Authorization: `Client-ID ${process.env.IMGUR_CLIENT_ID}`
          }
      });

      return response.data.data.link; // Return the Imgur URL of the uploaded image
  } catch (error) {
      console.error('Error uploading image to Imgur:', error);
      throw new Error('Error uploading image to Imgur');
  }
}

async function uploadImageToImgur(imageBase64) {
  try {
      const response = await axios.post('https://api.imgur.com/3/upload', {
          image: imageBase64,
          type: 'base64',
      }, {
          headers: {
              Authorization: `Client-ID ${process.env.IMGUR_CLIENT_ID}`
          }
      });

      return response.data.data.link; // Return the Imgur URL of the uploaded image
  } catch (error) {
      console.error('Error uploading image to Imgur:', error);
      throw new Error('Error uploading image to Imgur');
  }
}

app.post('/saveGangguanData', ensureAuthenticated, async (req, res) => {
  try {
      let imageUrl = '';
      if (req.body.foto) {
          const base64Image = req.body.foto;
          imageUrl = await uploadImageToImgur(base64Image);
      }

      const data = new GangguanData({
          ...req.body,
          user: req.user._id,
          foto: imageUrl,
      });
      await data.save();
      res.status(201).json(data); // Return the saved data
  } catch (err) {
      console.error('Error saving data:', err);
      res.status(400).json({ message: 'Error saving data', error: err.message });
  }
});

app.get('/getGangguanData', ensureAuthenticated, async (req, res) => {
  try {
      console.log('Fetching gangguan data for user:', req.user._id);
      const results = await GangguanData.find({ user: req.user._id });
      console.log('Gangguan data fetched:', results);
      res.status(200).json(results);
  } catch (err) {
      console.error('Error fetching data:', err);
      res.status(400).json({ message: 'Error fetching data', error: err.message });
  }
});


app.delete('/deleteGangguanData/:id', ensureAuthenticated, async (req, res) => {
  try {
    await GangguanData.findByIdAndDelete(req.params.id);
    res.status(200).send('Data deleted');
  } catch (err) {
    console.error(err);
    res.status(400).send('Error deleting data');
  }
});

// Endpoint to get user info
app.get('/user', ensureAuthenticated, (req, res) => {
  res.json({ username: req.user.username });
});

// Serve HTML pages
app.get('/', (req, res) => {
  if (req.isAuthenticated()) {
    res.redirect('/menu.html');
  } else {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
  }
});

app.get('/register.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'register.html'));
});

app.get('/menu.html', ensureAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'menu.html'));
});

app.get('/jkm_harian.html', ensureAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'jkm_harian.html'));
});

app.get('/temuan_gangguan.html', ensureAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'temuan_gangguan.html'));
});

app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
