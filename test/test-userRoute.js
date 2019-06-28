require("dotenv").config();
const chai = require("chai");
const chaiHttp = require("chai-http");
const jwt = require("jsonwebtoken");

const { app, runServer, closeServer } = require("../server");
const { TEST_DATABASE_URL, JWT_SECRET, JWT_EXPIRY } = require("../config");

const { User } = require("../app/models/user");

const expect = chai.expect;
chai.use(chaiHttp);

const testUser = {
  type: "studio",
  studio: "test studio",
  firstName: "first",
  lastName: "last",
  email: "test@user.com",
  password: "password",
  confirmPass: "password"
};

describe("/api/user/signup", () => {
  before(() => {
    return runServer(TEST_DATABASE_URL);
  });

  after(() => {
    return closeServer();
  });

  afterEach(() => {
    return User.deleteMany();
  });

  describe("POST", () => {
    it("should create a new user", () => {
      return chai
        .request(app)
        .post("/api/user/signup")
        .send(testUser)
        .then(res => {
          expect(res.body).to.have.keys("user", "jwt");
          expect(res.body.user).to.have.keys("_id", "firstName", "type");
          expect(res.body.user.firstName).to.equal("first");
          expect(res.body.user.type).to.equal("studio");
          return User.findOne({ email: "test@user.com" });
        })
        .then(user => {
          expect(user).to.not.be.null;
          return user.validatePassword("password");
        })
        .then(passwordIsCorrect => {
          expect(passwordIsCorrect).to.be.true;
        });
    });
  });
});

describe("/api/user/login", () => {
  before(() => {
    return runServer(TEST_DATABASE_URL);
  });

  after(() => {
    return closeServer();
  });

  beforeEach(() => {
    return User.hashPassword("password").then(password => {
      return User.create({
        type: "studio",
        studio: "test studio",
        firstName: "first",
        lastName: "last",
        email: "test@user.com",
        password
      });
    });
  });

  afterEach(() => {
    return User.deleteMany();
  });

  describe("POST", () => {
    it("should generate a JWT with valid credentials", () => {
      return chai
        .request(app)
        .post("/api/user/login")
        .send({ username: "test@user.com", password: "password" })
        .then(res => {
          expect(res.body).to.have.keys("jwt", "user");
          expect(res.body.user).to.be.a("object");
        });
    });
  });
});

describe("/api/user/auth/refresh", () => {
  before(() => {
    return runServer(TEST_DATABASE_URL);
  });

  after(() => {
    return closeServer();
  });

  afterEach(() => {
    return User.deleteMany();
  });

  describe("POST", () => {
    it("should generate a refresh authToken", () => {
      const authToken = jwt.sign({ payload: "test" }, JWT_SECRET, {
        expiresIn: JWT_EXPIRY,
        algorithm: "HS256"
      });

      return chai
        .request(app)
        .post("/api/user/auth/refresh")
        .set("Authorization", `Bearer ${authToken}`)
        .then(res => {
          expect(res).to.have.status(200);
        });
    });
  });
});
