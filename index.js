const express = require('express')
const {check, validationResult} = require("express-validator");
const bodyParser = require("body-parser");
const nodemailer = require("nodemailer");

const port = process.env.PORT || 8000;
const app = express();

app.use(bodyParser.urlencoded({ extended: true }));

const gmailUser = process.env.GMAIL_USER;
const gmailPass = process.env.GMAIL_PASS;
const contactRecipient = process.env.CONTACT_RECIPIENT;

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

app.listen(port, () => {
  console.log(`Contact API listening on port ${port}!`)
});