const express = require("express");
const router = express.Router();
const bodyParser = require("body-parser");
const { User } = require("../models/user");

router.use(express.json());
router.use(bodyParser.urlencoded({ extended: true }));

router.post("/signup", (req, res) => {
  const {
    type,
    studio,
    firstName,
    lastName,
    email,
    password,
    confirmPass
  } = req.body;
  console.log(req.body);

  // Verify input fields are strings
  const stringFields = [
    type,
    studio,
    firstName,
    lastName,
    email,
    password,
    confirmPass
  ];

  return User.find({ email })
    .countDocuments(num => {
      if (num !== 0) {
        return Promise.reject({
          code: 422,
          reason: "ValidationError",
          message: "Email already registered with an account",
          location: "email"
        });
      }
      console.log(password);
      return User.hashPassword(password);
    })
    .then(hash => {
      console.log(hash);
      return User.create({
        email,
        password: hash,
        firstName,
        lastName,
        studio,
        type
      });
    })
    .then(user => {
      console.log(user.serialize());
      return res.status(201).json(user.serialize());
    })
    .catch(err => {
      if (err.reason == "ValidationError") {
        return res.status(err.code).json(err);
      }
      return res.status(500).json({ message: "Internal Server Error" });
    });
});

module.exports = { router };
