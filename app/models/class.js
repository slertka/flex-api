const mongoose = require("mongoose");

const ClassSchema = mongoose.Schema({
  type: { type: String },
  length: { type: Number },
  wage: { type: Number },
  classDateDay: { type: String },
  classDateTime: { type: String },
  startDate: { type: Date },
  description: { type: String },
  postedBy: {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "Class" },
    studio: { type: String }
  }
});

const Class = mongoose.model("Class", ClassSchema);

module.exports = { Class };
