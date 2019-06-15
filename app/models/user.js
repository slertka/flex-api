const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = mongoose.Schema({
  email: { type: String, unique: true },
  password: { type: String },
  firstName: { type: String },
  lastName: { type: String },
  studio: { type: String },
  type: { type: String },
  classApplied: [{ type: mongoose.Schema.Types.ObjectId, ref: "Class" }]
});

UserSchema.methods.serialize = function() {
  return {
    id: this._id,
    firstName: this.firstName || "",
    type: this.type
  };
};

UserSchema.methods.validatePassword = function(password) {
  return bcrypt.compare(password, this.password);
};

UserSchema.statics.hashPassword = function(password) {
  return bcrypt.hash(password, 10);
};

const User = mongoose.model("User", UserSchema);

module.exports = { User };
