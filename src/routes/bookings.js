import { Router } from "express";
import { getDatabase } from "../config/db.js";
import { AppError, objectId } from "../utils/errors.js";
import { ObjectId } from "mongodb";

const router = Router();
const bookings = () => getDatabase().collection("bookings");
const services = () => getDatabase().collection("services");

router.post("/", async (request, response) => {
	const data = request.body;

	const service = await services().findOne({
		_id: new ObjectId(data.serviceId),
		approvalStatus: "approved",
		isAvailable: true,
	});
	if (!service)
		throw new AppError("Approved and available service not found", 404);

	const bookingData = {
		...data,
		finalAmount: null,
		status: "requested",
		paymentStatus: "unpaid",
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
	};

	const result = await bookings().insertOne({ ...bookingData });
	response
		.status(201)
		.json({ success: true, data: { ...bookingData, _id: result.insertedId } });
});

router.get("/", async (request, response) => {
	const filter = {};
	if (request.query.customerId) filter.customerId = request.query.customerId;
	if (request.query.technicianId)
		filter.technicianId = request.query.technicianId;
	if (request.query.status) filter.status = request.query.status;
	const result = await bookings()
		.find(filter)
		.sort({ createdAt: -1 })
		.toArray();
	response.json({ success: true, data: result });
});

router.patch("/:id/status", async (request, response) => {
	const bookingId = new ObjectId(request.params.id);
	const booking = await bookings().findOne({ _id: bookingId });

	if (!booking) throw new AppError("Booking not found", 404);

	const updated = await bookings().findOneAndUpdate(
		{ _id: bookingId },
		{
			$set: {
				status: request.body.status,
				updatedAt: new Date().toISOString(),
			},
		},
		{ returnDocument: "after" },
	);
	response.json({ success: true, data: updated });
});

router.post("/:id/cancel", async (request, response) => {
	request.body.status = "cancelled";
	const bookingId = new ObjectId(request.params.id);
	const booking = await bookings().findOne({ _id: bookingId });
	if (!booking) throw new AppError("Booking not found", 404);

	const updated = await bookings().findOneAndUpdate(
		{ _id: bookingId },
		{ $set: { status: "cancelled", updatedAt: new Date().toISOString() } },
		{ returnDocument: "after" },
	);
	response.json({ success: true, data: updated });
});

export default router;
