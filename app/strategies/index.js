const { Strategy: LocalStrategy } = require("passport-local");
const { Strategy: JwtStrategy, ExtractJwt } = require("passport-jwt");

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
      return cb(null, authUser);
    })
    .catch(err => {
      if (err.reason === "LoginError") {
        return cb(null, false, err);
      }
      return cb(err, false);
    });
});

const jwtStrategy = new JwtStrategy(
  {
    secretOrKey: JWT_SECRET,
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    algorithms: ["HS256"]
  },
  (payload, done) => {
    done(null, payload.payload);
  }
);

module.exports = { localStrategy, jwtStrategy };
