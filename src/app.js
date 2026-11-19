import cors from "cors";
import express from "express";
import { connectDatabase } from "./config/db.js";
import { env } from "./config/env.js";
import { errorHandler, notFound } from "./middleware/error.js";
import adminRoutes from "./routes/admin.js";
import bookingRoutes from "./routes/bookings.js";
import serviceRoutes from "./routes/services.js";
import userRoutes from "./routes/users.js";

const app = express();

app.use(
	cors(), //{ origin: env.frontendOrigin,}
);
app.use(express.json());

app.get("/health", (request, response) => {
	response.json({
		success: true,
		message: "FixMate server is running",
		environment: env.nodeEnv,
	});
});

// Database connection middleware
app.use(async (request, response, next) => {
	try {
		await connectDatabase();
		next();
	} catch (error) {
		error.statusCode = 503;
		error.message = "Database is unavailable";
		next(error);
	}
});

app.use("/api/users", userRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/admin", adminRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
