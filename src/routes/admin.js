import { Router } from "express";
import { getDatabase } from "../config/db.js";
import { AppError, objectId } from "../utils/errors.js";
import { ObjectId } from "mongodb";

const router = Router();
const services = () => getDatabase().collection("services");

router.get("/users", async (request, response) => {
	const users = await getDatabase()
		.collection("users")
		.find()
		.sort({ createdAt: -1 })
		.toArray();
	response.json({ success: true, data: users });
});

router.get("/services", async (request, response) => {
	const result = await services().find().sort({ createdAt: -1 }).toArray();
	response.json({ success: true, data: result });
});

router.patch("/services/:id/approval", async (request, response) => {
	if (!["approved", "rejected"].includes(request.body.approvalStatus)) {
		throw new AppError("Approval status must be approved or rejected", 400);
	}
	const service = await services().findOneAndUpdate(
		{ _id: new ObjectId(request.params.id) },
		{
			$set: {
				approvalStatus: request.body.approvalStatus,
				updatedAt: new Date(),
			},
		},
		{ returnDocument: "after" },
	);
	if (!service) throw new AppError("Service not found", 404);
	response.json({ success: true, data: service });
});

router.get("/bookings", async (request, response) => {
	const result = await getDatabase()
		.collection("bookings")
		.find()
		.sort({ createdAt: -1 })
		.toArray();
	response.json({ success: true, data: result });
});

router.get("/payments", async (request, response) => {
	const result = await getDatabase()
		.collection("payments")
		.find()
		.sort({ createdAt: -1 })
		.toArray();
	response.json({ success: true, data: result });
});

export default router;
