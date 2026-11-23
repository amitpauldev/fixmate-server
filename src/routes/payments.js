import { Router } from "express";
import { getDatabase } from "../config/db.js";

const router = Router();
const payments = () => getDatabase().collection("payments");

router.post("/", async (request, response) => {
	const payment = request.body;
	const result = await payments().insertOne(payment);
	response
		.status(201)
		.json({ success: true, data: { ...payment, _id: result.insertedId } });
});

export default router;
