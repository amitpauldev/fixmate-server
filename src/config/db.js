import { MongoClient } from "mongodb";
import { env } from "./env.js";

const client = new MongoClient(env.mongodbUri);

let database;

export const connectDatabase = async () => {
  if (database) {
    return database;
  }

  await client.connect();
  database = client.db(env.databaseName);
  console.log(`MongoDB connected: ${env.databaseName}`);

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
};