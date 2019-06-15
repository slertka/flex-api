const { Strategy: LocalStrategy } = require("passport-local");
const { Strategy: JwtStrategy, extractJwt } = require("passport-jwt");

const { User } = require("../models/user");
const { JWT_SECRET } = require("../../config");

const localStrategy = new LocalStrategy((user, password, cb) => {
  let authUser;
  User.findOne({ email: user })
    .then(_user => {
      authUser = _user;
      if (!user) {
        return Promise.reject({
          reason: "LoginError",
          message: "Incorrect username or password"
        });
      }
      return authUser.validatePassword(password);
    })
    .then(isValid => {
      if (!isValid) {
        return Promise.reject({
          reason: "LoginError",
          message: "Incorrect username or password"
        });
      }
      return cb(null, user);
    })
    .catch(err => {
      if (err.reason === "LoginError") {
        return cb(null, false, err);
      }
      return cb(err, false);
    });
});

module.exports = { localStrategy };
