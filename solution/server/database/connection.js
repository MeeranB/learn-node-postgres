const pg = require("pg");
const dotenv = require("dotenv");

dotenv.config(); // load environment variables

const db = new pg.Pool(); // create a pool of available connections

module.exports = db; // export the pool for use elsewhere on our server
