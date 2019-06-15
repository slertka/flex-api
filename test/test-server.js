const chai = require("chai");
const chaiHttp = require("chai-http");

const { app } = require("../server");

const should = chai.should();
chai.use(chaiHttp);
