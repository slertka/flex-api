const express = require("express");
const router = express.Router();
const bodyParser = require("body-parser");
const { User } = require("../models/user");

// JWT
const jwt = require("jsonwebtoken");
const { JWT_SECRET, JWT_EXPIRY } = require("../../config");
const createAuthToken = payload => {
  return jwt.sign({ payload }, JWT_SECRET, {
    expiresIn: JWT_EXPIRY,
    algorithm: "HS256"
  });
};

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

  const fields = [
    "type",
    "studio",
    "firstName",
    "lastName",
    "email",
    "password",
    "confirmPass"
  ];

  // Verify all fields are complete
  const emptyField = fields.find(field => {
    return !(field in req.body);
  });
  if (emptyField) {
    return res.status(422).json({
      code: 422,
      reason: "ValidationError",
      message: "Missing value in required field",
      location: emptyField
    });
  }

  // Verify input fields are strings
  const nonStringField = fields.find(field => {
    return field in req.body && typeof req.body[field] !== "string";
  });
  if (nonStringField) {
    return res.status(422).json({
      code: 422,
      reason: "ValidationError",
      message: "Input must be a variable type 'String'",
      location: nonStringField
    });
  }

  // Verify user profile type is instructor or studio
  if (type !== ("instructor" || "studio")) {
    return res.status(422).json({
      code: 422,
      reason: "ValidationError",
      message: "User type must be instructor or studio",
      location: "type"
    });
  }

  // Verify email looks like an email
  const re = /\S+@\S+\.\S+/;
  if (!re.test(email)) {
    return res.status(422).json({
      code: 422,
      reason: "ValidationError",
      message: "Invalid email entered",
      location: "email"
    });
  }

  // Verify fields are trimmed
  const nonTrimmedField = fields.find(
    field => req.body[field] !== req.body[field].trim()
  );
  if (nonTrimmedField) {
    return res.status(422).json({
      code: 422,
      reason: "ValidationError",
      message: "Cannot start or end with whitespace",
      location: nonStringField
    });
  }

  // Verify passwords meet minimum & maximum requirements
  const requiredLengths = {
    type: {
      min: 1
    },
    email: {
      min: 1
    },
    studio: {
      min: 1
    },
    firstName: {
      min: 1
    },
    lastName: {
      min: 1
    },
    password: {
      min: 8,
      max: 72
    }
  };
  const fieldTooSmall = Object.keys(requiredLengths).find(
    field =>
      "min" in requiredLengths[field] &&
      req.body[field].trim().length < requiredLengths[field].min
  );
  const fieldTooLarge = Object.keys(requiredLengths).find(
    field =>
      "max" in requiredLengths[field] &&
      req.body[field].length > requiredLengths[field].max
  );
  if (fieldTooSmall || fieldTooLarge) {
    return res.status(422).json({
      code: 422,
      reason: "ValidationError",
      message: fieldTooSmall
        ? `Must be at least ${
            requiredLengths[fieldTooSmall].min
          } character(s) long`
        : `Must be less than ${
            requiredLengths[fieldTooLarge].max
          } characters long`,
      location: fieldTooSmall || fieldTooLarge
    });
  }

  // Verify passwords match
  if (password !== confirmPass) {
    return res.status(422).json({
      code: 422,
      reason: "ValidationError",
      message: "Passwords do not match",
      location: "password"
    });
  }

  return User.findOne({ email })
    .then(user => {
      if (user) {
        return Promise.reject({
          code: 422,
          reason: "ValidationError",
          message: "Email already registered with an account",
          location: "email"
        });
      }
      return User.hashPassword(password);
    })
    .then(hash => {
      return User.create({
        email,
        password: hash,
        firstName,
        lastName,
        studio,
        type
      });
    })
    .then(_user => {
      const jwt = createAuthToken(email);
      const user = _user.serialize();
      return res.status(201).json({
        user,
        jwt
      });
    })
    .catch(err => {
      if (err.reason == "ValidationError") {
        return res.status(err.code).json(err);
      }
      return res.status(500).json({ message: "Internal Server Error" });
    });
});

module.exports = { router };
