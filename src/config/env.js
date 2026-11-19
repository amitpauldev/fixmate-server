import "dotenv/config";

const required = (name) => {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
};

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 5000),
  frontendOrigin: process.env.FRONTEND_ORIGIN || "http://localhost:3000",
  mongodbUri: required("MONGODB_URI"),
  databaseName: required("DB_NAME"),
};
