const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({path: "./.env"});
// DATABASE
const DB = process.env.DB.replace(
    "<PASSWORD>",
    process.env.PASSWORD
).replace(
    "<USER>",
    process.env.USER
);

console.log(DB);

mongoose.connect(DB, {useNewUrlParser: true, useUnifiedTopology: true}).then(() => {console.log("MongoDB connected!")});

const app = express();

app.get("/", (req, res) => {
    res.json({"works": true});
})

app.listen(3002, () => {console.log("TOP AUTHN listening...")})