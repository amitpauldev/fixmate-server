import { Router } from "express";
import { getDatabase } from "../config/db.js";
import { AppError } from "../utils/errors.js";
import { ObjectId } from "mongodb";

const router = Router();
const collection = () => getDatabase().collection("services");

router.get("/", async (request, response) => {
	const { search, category, area, sort } = request.query;
	const filter = { approvalStatus: "approved", isAvailable: true };

	if (category) filter.category = category;
	if (area) filter.area = area;
	if (search) {
		filter.$or = [
			{ title: { $regex: search, $options: "i" } },
			{ category: { $regex: search, $options: "i" } },
			{ description: { $regex: search, $options: "i" } },
		];
	}

	const sortBy =
		sort === "price-asc"
			? { price: 1 }
			: sort === "price-desc"
				? { price: -1 }
				: { createdAt: -1 };
	const services = await collection().find(filter).sort(sortBy).toArray();
	response.json({ success: true, data: services });
});

router.get("/:id", async (request, response) => {
	const service = await collection().findOne({
		_id: ObjectId(request.params.id),
		approvalStatus: "approved",
		isAvailable: true,
	});
	if (!service) throw new AppError("Service not found", 404);
	response.json({ success: true, data: service });
});

router.get("/technician/:id", async (request, response) => {
	const services = await collection()
		.find({ technicianId: request.params.id })
		.toArray();
	response.json({ success: true, data: services });
});

router.post("/", async (request, response) => {
	const service = request.body;
	const result = await collection().insertOne(service);
	response
		.status(201)
		.json({ success: true, data: { ...service, _id: result.insertedId } });
});

router.patch("/:id", async (request, response) => {
	const updates = request.body;
	const service = await collection().findOneAndUpdate(
		{ _id: ObjectId(request.params.id) },
		{ $set: updates },
		{ returnDocument: "after" },
	);
	if (!service) throw new AppError("Service not found", 404);
	response.json({ success: true, data: service });
});

router.delete("/:id", async (request, response) => {
	const id = request.params.id;
	const result = await collection().deleteOne({
		_id: ObjectId(id),
	});
	if (!result.deletedCount) throw new AppError("Service not found", 404);
	response.status(204).send();
});

export default router;
