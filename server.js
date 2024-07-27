const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('MongoDB connected...');
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

const User = mongoose.model('User', userSchema);
const JkmData = mongoose.model('JkmData', jkmSchema);
const GangguanData = mongoose.model('GangguanData', gangguanSchema);

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use('/static', express.static(path.join(__dirname, 'static')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use(express.static(path.join(__dirname, 'views')));

// Session management
app.use(session({
  secret: process.env.SESSION_SECRET || 'secret',
  resave: false,
  saveUninitialized: false,
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

// Set up multer for file uploads with size limits
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB file size limit
}).single('foto');

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


// Endpoints
// Temuan Gangguan CRUD
app.post('/saveGangguanData', ensureAuthenticated, upload.single('foto'), async (req, res) => {
  const data = new GangguanData({
    ...req.body,
    user: req.user._id,
    foto: req.file ? req.file.path : '',
  });
  try {
    await data.save();
    res.status(201).json(data); // Return the saved data
  } catch (err) {
    console.error(err);
    res.status(400).send('Error saving data');
  }
});

app.get('/getGangguanData', ensureAuthenticated, async (req, res) => {
  try {
    const results = await GangguanData.find({ user: req.user._id });
    res.status(200).json(results);
  } catch (err) {
    console.error(err);
    res.status(400).send('Error fetching data');
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
