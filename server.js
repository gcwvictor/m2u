const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
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
const jkmSchema = new mongoose.Schema({
  tanggal: String,
  unit_mesin: String,
  jkm_harian: Number,
  jumlah_jkm_har: Number,
  jsmo: Number,
  jsb: Number,
  keterangan: String,
});

const gangguanSchema = new mongoose.Schema({
  tanggal: String,
  nama_gangguan: String,
  unit_mesin: String,
  foto: String,
});

const JkmData = mongoose.model('JkmData', jkmSchema);
const GangguanData = mongoose.model('GangguanData', gangguanSchema);

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  },
});

const upload = multer({ storage });

// Endpoints
// JKM Harian CRUD
app.post('/saveJkmData', async (req, res) => {
  const data = new JkmData(req.body);
  try {
    await data.save();
    res.status(201).send('Data added...');
  } catch (err) {
    res.status(400).send('Error saving data');
  }
});

app.get('/getJkmData', async (req, res) => {
  try {
    const results = await JkmData.find();
    res.status(200).send(results);
  } catch (err) {
    res.status(400).send('Error fetching data');
  }
});

// Temuan Gangguan CRUD
app.post('/saveGangguanData', upload.single('foto'), async (req, res) => {
  const data = new GangguanData({
    ...req.body,
    foto: req.file ? req.file.path : '',
  });
  try {
    await data.save();
    res.status(201).send('Data added...');
  } catch (err) {
    res.status(400).send('Error saving data');
  }
});

app.get('/getGangguanData', async (req, res) => {
  try {
    const results = await GangguanData.find();
    res.status(200).send(results);
  } catch (err) {
    res.status(400).send('Error fetching data');
  }
});

app.delete('/deleteJkmData/:id', async (req, res) => {
    try {
      await JkmData.findByIdAndDelete(req.params.id);
      res.status(200).send('Data deleted');
    } catch (err) {
      res.status(400).send('Error deleting data');
    }
  });
  
app.delete('/deleteGangguanData/:id', async (req, res) => {
  try {
    await GangguanData.findByIdAndDelete(req.params.id);
    res.status(200).send('Data deleted');
  } catch (err) {
    res.status(400).send('Error deleting data');
  }
});

app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});
