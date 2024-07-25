const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');

const app = express();
const port = 3000;

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'mydatabase'
});

db.connect((err) => {
    if (err) {
        throw err;
    }
    console.log('MySQL connected...');
});

app.use(bodyParser.json());

app.post('/saveData', (req, res) => {
    let data = req.body;
    let sql = 'INSERT INTO mytable SET ?';
    let query = db.query(sql, data, (err, result) => {
        if (err) throw err;
        res.send('Data added...');
    });
});

app.get('/getData', (req, res) => {
    let sql = 'SELECT * FROM mytable';
    let query = db.query(sql, (err, results) => {
        if (err) throw err;
        res.send(results);
    });
});

app.listen(port, () => {
    console.log(`Server started on port ${port}`);
});
