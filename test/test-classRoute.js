require("dotenv").config();
const chai = require("chai");
const chaiHttp = require("chai-http");
const jwt = require("jsonwebtoken");

const { app, runServer, closeServer } = require("../server");
const { TEST_DATABASE_URL, JWT_SECRET, JWT_EXPIRY } = require("../config");

const expect = chai.expect;
chai.use(chaiHttp);

const { User } = require("../app/models/user");
const { Class } = require("../app/models/class");

describe("/api/dashboard", () => {
  let studioUser;
  let instructorUser;
  let instructorUser2;
  let yogaClass;
  let studioAuthToken;
  let instructorAuthToken;
  let instructor2AuthToken;

  before(() => {
    return runServer(TEST_DATABASE_URL);
  });

  after(() => {
    return closeServer();
  });

  // create studio user
  beforeEach(() => {
    return User.hashPassword("password").then(password => {
      return User.create({
        type: "studio",
        studio: "test studio",
        firstName: "first",
        lastName: "last",
        email: "test@user.com",
        password
      }).then(_user => {
        studioUser = _user;
        return studioUser;
      });
    });
  });

  // create instructor user
  beforeEach(() => {
    return User.hashPassword("password").then(password => {
      return User.create({
        type: "instructor",
        studio: "test studio",
        firstName: "first",
        lastName: "last",
        email: "test2@user.com",
        password
      }).then(_user => {
        instructorUser = _user;
        return instructorUser;
      });
    });
  });

  // create second instructor user
  beforeEach(() => {
    return User.hashPassword("password").then(password => {
      return User.create({
        type: "instructor",
        studio: "test studio",
        firstName: "first",
        lastName: "last",
        email: "test3@user.com",
        password
      }).then(_user => {
        instructorUser2 = _user;
        return instructorUser2;
      });
    });
  });

  // create class
  beforeEach(() => {
    return Class.create({
      type: "vinyasa",
      length: 60,
      wage: 20,
      userApplied: [instructorUser._id],
      classDateDay: "monday",
      classDateTime: "18:00",
      startDate: new Date(),
      datePosted: new Date(),
      description:
        "Occaecat anim eu aliquip voluptate ut proident qui nisi exercitation deserunt labore tempor.",
      postedBy: studioUser._id
    }).then(_class => {
      yogaClass = _class;
      return yogaClass;
    });
  });

  // create instructor authToken
  beforeEach(() => {
    return (instructorAuthToken = jwt.sign(
      { payload: instructorUser },
      JWT_SECRET,
      {
        expiresIn: JWT_EXPIRY,
        algorithm: "HS256"
      }
    ));
  });

  // create instructor 2 authToken
  beforeEach(() => {
    return (instructor2AuthToken = jwt.sign(
      { payload: instructorUser2 },
      JWT_SECRET,
      {
        expiresIn: JWT_EXPIRY,
        algorithm: "HS256"
      }
    ));
  });

  // create studio authToken
  beforeEach(() => {
    return (studioAuthToken = jwt.sign({ payload: studioUser }, JWT_SECRET, {
      expiresIn: JWT_EXPIRY,
      algorithm: "HS256"
    }));
  });

  // delete users from database after created
  afterEach(() => {
    return User.deleteMany();
  });

  afterEach(() => {
    return Class.deleteMany();
  });

  describe("GET /classes/:userId", () => {
    it("should return classes that the instructor user has not yet applied for", () => {
      return chai
        .request(app)
        .get(`/api/dashboard/classes/${instructorUser._id}`)
        .set("Authorization", `Bearer ${instructorAuthToken}`)
        .then(res => {
          expect(res.body).to.be.a("array");
        });
    });
  });

  describe("GET /class/apply/:classId", () => {
    it("should get classes that an instructor user has already applied for", () => {
      return chai
        .request(app)
        .get(`/api/dashboard/applied/${instructorUser._id}`)
        .set("Authorization", `Bearer ${instructorAuthToken}`)
        .then(res => {
          expect(res.body).to.be.a("array");
        });
    });
  });

  describe("GET /studio/:userId", () => {
    it("should get classes associated with a studio profile", () => {
      return chai
        .request(app)
        .get(`/api/dashboard/studio/${studioUser._id}`)
        .set("Authorization", `Bearer ${studioAuthToken}`)
        .then(res => {
          expect(res.body).to.be.a("array");
        });
    });
  });

  describe("POST /postClass", () => {
    it("should create a new class", () => {
      return chai
        .request(app)
        .post("/api/dashboard/postClass")
        .set("Authorization", `Bearer ${studioAuthToken}`)
        .send({
          type: "hatha",
          length: 75,
          wage: 25,
          datePosted: new Date(),
          classDateDay: "sunday",
          classDateTime: "19:00",
          startDate: new Date(),
          postedBy: studioUser._id,
          description:
            "Qui sit eu laboris occaecat deserunt ipsum non eiusmod qui pariatur."
        })
        .then(res => {
          expect(res).to.have.status(201);
          expect(res.body).to.have.keys(
            "type",
            "length",
            "wage",
            "datePosted",
            "classDateDay",
            "classDateTime",
            "postedBy",
            "startDate",
            "description",
            "userApplied",
            "__v",
            "_id"
          );
        });
    });
  });

  describe("PUT /class/apply/:classId", () => {
    it("should update the class document when an instructor applies for a class", () => {
      return chai
        .request(app)
        .put(`/api/dashboard/class/apply/${yogaClass._id}`)
        .set("Authorization", `Bearer ${instructor2AuthToken}`)
        .then(res => {
          expect(res).to.have.status(201);
          expect(res.body).to.be.a("object");
          expect(res.body.userApplied.length).to.equal(2);
          // how to check if user was updated to add class _id to classApplied
        });
    });
  });

  describe("PUT /class/withdraw/:classId", () => {
    it("should update class document when an instructor withdraws from a class", () => {
      return chai
        .request(app)
        .put(`/api/dashboard/class/withdraw/${yogaClass._id}`)
        .set("Authorization", `Bearer ${instructorAuthToken}`)
        .then(res => {
          expect(res.body.userApplied.length).to.equal(0);
        });
    });
  });

  describe("PUT /edit/:classId", () => {
    it("should edit an existing class posting", () => {
      return chai
        .request(app)
        .put(`/api/dashboard/edit/${yogaClass._id}`)
        .set("Authorization", `Bearer ${studioAuthToken}`)
        .send({
          type: "sculpt",
          length: 60,
          wage: 25,
          classDateDay: "monday",
          classDateTime: "18:30",
          startDate: new Date(),
          description:
            "Culpa consectetur fugiat non id laborum reprehenderit nulla est."
        })
        .then(res => {
          expect(res).to.have.status(201);
          let _class = res.body[0];
          expect(_class.type).to.equal("sculpt");
          expect(_class.length).to.equal(60);
          expect(_class.wage).to.equal(25);
          expect(_class.classDateDay).to.equal("monday");
          expect(_class.classDateTime).to.equal("18:30");
          expect(_class.description).to.equal(
            "Culpa consectetur fugiat non id laborum reprehenderit nulla est."
          );
        });
    });
  });

  describe("DELETE /class/:classId", () => {
    it("should delete an existing class that a studio posted", () => {
      return chai
        .request(app)
        .delete(`/api/dashboard/class/${yogaClass._id}`)
        .set("Authorization", `Bearer ${studioAuthToken}`)
        .then(res => {
          expect(res).to.have.status(200);
          expect(res.body).to.equal(`Class ${yogaClass._id} deleted`);
        });
    });
  });
});
