const mongoose = require("mongoose");

const ClassSchema = mongoose.Schema({
  type: { type: String },
  length: { type: Number },
  wage: { type: Number },
  classDateDay: { type: String },
  classDateTime: { type: String },
  startDate: { type: Date },
  description: { type: String },
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  datePosted: { type: Date },
  userApplied: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
});

const Class = mongoose.model("Class", ClassSchema);

module.exports = { Class };
