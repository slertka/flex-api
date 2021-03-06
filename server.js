// Initialize App
require("dotenv").config();
const express = require("express");
const app = express();

// Mongoose
const mongoose = require("mongoose");
mongoose.Promise = global.Promise;

// Log Requests
const morgan = require("morgan");
app.use(morgan("common"));

// Config
const { PORT, DATABASE_URL, CLIENT_ORIGIN } = require("./config");

// CORS
const cors = require("cors");
app.use(
  cors({
    origin: CLIENT_ORIGIN
  })
);

// Auth Strategies
const passport = require("passport");
const { localStrategy, jwtStrategy } = require("./app/strategies/index");
passport.use(localStrategy);
passport.use(jwtStrategy);

// Routers
const { router: userRouter } = require("./app/routes/user-route");
app.use("/api/user", userRouter);
const { router: classRouter } = require("./app/routes/class-route");
app.use("/api/dashboard", classRouter);
app.use((error, req, res, next) => {
  console.log(error);
  next();
});

// Initialize Server
let server;
function runServer(databaseURL, port = PORT) {
  return new Promise((resolve, reject) => {
    mongoose.connect(databaseURL, { useNewUrlParser: true }, err => {
      if (err) {
        return reject(err);
      }
      server = app
        .listen(port, () => {
          console.log(`Your app is now listening on port ${PORT}`);
          resolve();
        })
        .on("error", err => {
          mongoose.disconnect();
          reject(err);
        });
    });
  });
}

// Close Server
function closeServer() {
  mongoose.disconnect().then(() => {
    return new Promise((resolve, reject) => {
      console.log(`Closing server`);
      server.close(err => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    });
  });
}

if (require.main === module) {
  runServer(DATABASE_URL).catch(err => console.log(err));
}

module.exports = { app, runServer, closeServer };
