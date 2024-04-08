const { MongoClient } = require("mongodb");
require("dotenv/config");

const database = new MongoClient(`mongodb+srv://admin1:${process.env.PASS_DB}@freecluster.7xu0m7g.mongodb.net/?retryWrites=true&w=majority`);
async function connectToDatabase() {
    try {
      await database.connect();
      console.log("Connected to the database");
    } catch (error) {
      console.error("Database Error: ", error.message);
    }
};

async function find(page, collection) {
    const exists = await database.db("anime").collection(collection).findOne({ _id: page });
    if (exists) return exists;
    else return false
};

async function insert(doc, collection) {
    const ttl = 4 * 60 * 60
    await database.db("anime").collection(collection).createIndex({ "expiresAt": 1 }, { expireAfterSeconds: ttl });
    doc.expiresAt = new Date();
    doc.expiresAt.setSeconds(doc.expiresAt.getSeconds() + ttl);
    await database.db("anime").collection(collection).insertOne(doc);
}

module.exports = { connectToDatabase, find, insert }