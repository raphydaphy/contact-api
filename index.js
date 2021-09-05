const express = require('express')
const {check, validationResult} = require("express-validator");
const bodyParser = require("body-parser");
const nodemailer = require("nodemailer");
const mysql = require("mysql");

require("dotenv").config();

const port = process.env.PORT || 8000;
const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const gmailUser = process.env.GMAIL_USER;
const gmailPass = process.env.GMAIL_PASS;
const contactRecipient = process.env.CONTACT_RECIPIENT;

const dbPool = mysql.createPool({
  connectionLimit: 10,
  host: process.env.MYSQL_HOST || "localhost",
  user: process.env.MYSQL_USER || "contactapi",
  password: process.env.MYSQL_PASS || "password",
  database: process.env.MYSQL_DB || "contactapi"
});

async function query(sql, values) {
  return new Promise((resolve, reject) => {
    if (!dbPool) return reject(new Error("Database not initialized!"));
    dbPool.query(sql, values, (err, res) => {
      if (err) {
        console.warn("Failed to execute query:", sql, err);
        return reject("MySQL Error");
      }
      resolve(res);
    });
  });
}

async function query1(sql, values) {
  let res = await query(sql, values);
  return res.length === 0 ? null : res[0];
}

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: gmailUser,
    pass: gmailPass
  }
});

app.get('/', (req, res) => {
  res.send({
    response: "OK"
  });
});

app.post('/contact', [
  check("name").notEmpty().trim().escape(),
  check("email").isEmail().normalizeEmail(),
  check("message").notEmpty().trim().escape()
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({errors: errors.array()});
  }

  let name = req.body["name"];
  let email = req.body["email"];
  let message = req.body["message"];
  let redirect = req.body["redirect"];

  transporter.sendMail({
    from: gmailUser,
    to: contactRecipient,
    subject: "New message from your website!",
    text: `Name: ${name} \nEmail: ${email} \nMessage: ${message}`
  }).then((info) => {
    console.info("Message processed: ", info.response);
  }).catch((err) => {
    console.error("Failed to send message: ", err);
    console.info(`Failed message details: \nName: ${name} \nEmail: ${email} \nMessage: ${message}`);
  });

  res.writeHead(301,
    {Location: redirect + "?response=success"}
  ).end();
});

app.post("/joinMailingList", [
  check("listId").isString(),
  check("email").isEmail().normalizeEmail()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({errors: errors.array()});
  }

  const listId = req.body["listId"];
  const email = req.body["email"];

  const list = await query1(`
    SELECT * FROM mailingLists WHERE listId = ?
  `, [listId]);

  if (!list) return res.json({error: "Invalid Mailing List ID", listId});

  const existingSignup = await query1(`
    SELECT * FROM mailingListSignups
    WHERE listId = ? AND email = ?
  `, [listId, email]);

  if (existingSignup) {
    console.info("Ignoring double signup for mailing list #" + listId + " with email '" + email + "'");
    return res.json({success: true});
  }

  console.info("Received sign up for mailing list #" + listId + " with email '" + email + "'");
  await query(`
    INSERT INTO mailingListSignups (listId, email) VALUES (?, ?)
  `, [listId, email]);
  return res.json({success: true});
});

app.listen(port, () => {
  console.log(`Contact API listening on port ${port}!`)
});