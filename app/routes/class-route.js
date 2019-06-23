const express = require("express");
const passport = require("passport");
const router = express.Router();
const bodyParser = require("body-parser");

const { User } = require("../models/user");
const { Class } = require("../models/class");

router.use(express.json());
router.use(bodyParser.urlencoded({ extended: true }));

// JWT Authentications
const jwtAuth = passport.authenticate("jwt", { session: false });

// get all classes that an instructor has not yet applied for
router.get("/classes/:userId", jwtAuth, (req, res) => {
  const userId = req.params.userId;
  return Class.find({
    userApplied: {
      $nin: userId
    }
  })
    .sort({ datePosted: -1 })
    .populate("postedBy")
    .then(classes => res.json(classes));
});

// get all classes that an instructor has already applied for
router.get("/applied/:userId", jwtAuth, (req, res) => {
  const userId = req.params.userId;
  return Class.find({
    userApplied: {
      $in: userId
    }
  })
    .sort({ datePosted: -1 })
    .populate("postedBy")
    .then(classes => res.json(classes));
});

// get classes associated with a user
router.get("/studio/:userId", jwtAuth, (req, res) => {
  const userId = req.params.userId;
  return Class.find({ postedBy: userId })
    .sort({ datePosted: -1 })
    .populate("postedBy")
    .populate("userApplied")
    .then(classes => res.json(classes));
});

// update document when user(instructor) applies for a class
router.put("/class/:classId", jwtAuth, (req, res) => {
  const { userId } = req.body;
  const classId = req.params.classId;

  // Verify user hasn't already applied to class
  return Class.find({ _id: classId }, { userApplied: 1 })
    .then(_userArr => {
      const userArr = _userArr[0].userApplied;
      const userApplied = userArr.find(id => id == userId);
      if (userApplied) {
        return Promise.reject({
          code: 422,
          reason: "AlreadyApplied",
          message: "User already applied to this class posting"
        });
      }

      return Class.updateOne(
        // add user to class "userApplied"
        { _id: classId },
        {
          $push: {
            userApplied: userId
          }
        }
      );
    })
    .then(() =>
      User.updateOne(
        // add class to user "classApplied"
        { _id: userId },
        {
          $push: {
            classApplied: classId
          }
        }
      )
    )
    .then(() => Class.findOne({ _id: classId }))
    .then(_class => {
      return res.status(201).json(_class);
    })
    .catch(err => {
      if (err.reason === "AlreadyApplied") {
        return res.status(422).json(err);
      }
      console.log(err);
    });
});

// edit class listing
router.put("/edit/:classId", jwtAuth, (req, res) => {
  const classId = req.params.classId;

  const {
    type,
    length,
    wage,
    classDateDay,
    classDateTime,
    startDate,
    description
  } = req.body;

  // verify other fields are not in request body to be updated --> don't need to do this bc i explicity class? should i set this up differently

  const fields = [
    "type",
    "classDateDay",
    "classDateTime",
    "startDate",
    "description",
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
  const stringFields = fields.slice(0, 5);
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
  const numFields = fields.slice(5, 7);
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

  // verify number fields is non-zero and non negative
  const negativeNumInField = numFields.find(field => {
    return field in req.body && req.body[field] <= 0;
  });
  if (negativeNumInField) {
    return res.status(422).json({
      code: 422,
      reasond: "ValidationError",
      message: "Field must be greater than 0",
      location: negativeNumInField
    });
  }

  return Class.updateOne(
    { _id: classId },
    {
      $set: {
        type,
        length,
        wage,
        classDateDay,
        classDateTime,
        startDate,
        description
      }
    }
  )
    .then(res => {
      if (res.nModified === 0 && res.n === 0) {
        return Promise.reject({
          code: 244,
          reason: "ValidationError",
          message: "Document could not be updated"
        });
      }
      return Class.find({ _id: classId });
    })
    .then(_class => res.status(201).json(_class))
    .catch(err => {
      if (err.reason === "ValidationError") {
        return res.json(err);
      }
      console.log(err);
    });
});

router.delete("/class/:classId", jwtAuth, (req, res) => {
  const classId = req.params.classId;
  return Class.deleteOne({ _id: classId }).then(() =>
    res.json(`Class ${classId} deleted`)
  );
});

router.post("/postClass", jwtAuth, (req, res) => {
  const {
    type,
    length,
    wage,
    classDateDay,
    classDateTime,
    startDate,
    datePosted,
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
    "datePosted",
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
  const stringFields = fields.slice(0, 7);
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
  const numFields = fields.slice(7, 9);
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

  // verify number fields is non-zero and non negative
  const negativeNumInField = numFields.find(field => {
    return field in req.body && req.body[field] <= 0;
  });
  if (negativeNumInField) {
    return res.status(422).json({
      code: 422,
      reasond: "ValidationError",
      message: "Field must be greater than 0",
      location: negativeNumInField
    });
  }

  return Class.create({
    type,
    length,
    postedBy,
    wage,
    datePosted,
    classDateDay,
    classDateTime,
    startDate,
    description
  }).then(_class => res.status(201).json(_class));
});

module.exports = { router, jwtAuth };
