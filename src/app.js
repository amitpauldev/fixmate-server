import cors from "cors";
import express from "express";
import { env } from "./config/env.js";
import { errorHandler, notFound } from "./middleware/error.js";

const app = express();

app.use(
	cors({
		origin: env.frontendOrigin,
	}),
);
app.use(express.json());

app.get("/health", (request, response) => {
	response.json({
		success: true,
		message: "FixMate server is running",
		environment: env.nodeEnv,
	});
});

app.use(notFound);
app.use(errorHandler);

export default app;
