const express = require("express");
const router = express.Router();
const bodyParser = require("body-parser");

const { User } = require("../models/user");
const { Class } = require("../models/class");

router.use(express.json());
router.use(bodyParser.urlencoded({ extended: true }));

router.post("/postClass", (req, res) => {
  const {
    type,
    length,
    wage,
    classDateDay,
    classDateTime,
    startDate,
    description,
    postedBy
  } = req.body;

  const fields = [
    "type",
    "classDateDay",
    "classDateTime",
    "startDate",
    "description",
    "postedBy",
    "length",
    "wage"
  ];

  // check all fields are in request body
  const missingField = fields.find(field => {
    return !(field in req.body);
  });
  if (missingField) {
    return res.status(244).json({
      code: 422,
      reason: "ValidationError",
      message: "Missing field in request body to complete request",
      location: missingField
    });
  }

  // verify fields that are string types
  const stringFields = fields.slice(0, 6);
  const nonStringField = stringFields.find(field => {
    return field in req.body && typeof req.body[field] !== "string";
  });
  if (nonStringField) {
    return res.status(244).json({
      code: 422,
      reason: "ValidationError",
      message: "Field must be a string",
      location: nonStringField
    });
  }

  // verify fields that are number types
  const numFields = fields.slice(6, 7);
  const nonNumField = numFields.find(field => {
    return field in req.body && typeof req.body[field] !== "number";
  });
  if (nonNumField) {
    return res.status(422).json({
      code: 422,
      reason: "ValidationError",
      message: "Field must be a number",
      location: nonNumField
    });
  }

  return Class.create({
    type,
    length,
    postedBy,
    wage,
    classDateDay,
    classDateTime,
    startDate,
    description
  }).then(_class => res.status(201).json(_class));
});
// GET Class.find({postedBy: req.user.id}).populate("postedBy").then(_classes => _classes[0].postedBy.studio)

module.exports = { router };
