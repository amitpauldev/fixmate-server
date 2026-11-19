import { MongoClient } from "mongodb";
import { env } from "./env.js";

const client = new MongoClient(env.mongodbUri);

let database;
let connectionPromise;

export const connectDatabase = async () => {
  if (database) {
    return database;
  }

  if (!connectionPromise) {
    connectionPromise = client
      .connect()
      .then(() => {
        database = client.db(env.databaseName);
        console.log(`MongoDB connected: ${env.databaseName}`);
        return database;
      })
      .catch((error) => {
        connectionPromise = undefined;
        throw error;
      });
  }

  await connectionPromise;

  return database;
};

export const getDatabase = () => {
  if (!database) {
    throw new Error("Database has not been connected");
  }

  return database;
};

export const closeDatabase = async () => {
  await client.close();
  database = undefined;
  connectionPromise = undefined;
};