import { Router } from "express";
import { getDatabase } from "../config/db.js";
import { AppError, objectId } from "../utils/errors.js";

const router = Router();
const collection = () => getDatabase().collection("user");

router.post("/", async (request, response) => {
	const {
		name,
		email,
		role = "customer",
		phone = "",
		area = "",
		bio = "",
	} = request.body;

	if (!name || !email || !["customer", "technician"].includes(role)) {
		throw new AppError(
			"Name, email, and a valid customer or technician role are required",
			400,
		);
	}

	if (await collection().findOne({ email })) {
		throw new AppError("A user with this email already exists", 409);
	}

	const user = {
		name,
		email,
		role,
		phone,
		area,
		bio,
		createdAt: new Date(),
		updatedAt: new Date(),
	};
	const result = await collection().insertOne(user);
	response
		.status(201)
		.json({ success: true, data: { ...user, _id: result.insertedId } });
});

router.get("/", async (request, response) => {
	const filter = request.query.role ? { role: request.query.role } : {};
	const users = await collection()
		.find(filter)
		.sort({ createdAt: -1 })
		.toArray();
	response.json({ success: true, data: users });
});

router.get("/:id", async (request, response) => {
	const user = await collection().findOne({
		_id: objectId(request.params.id, "user id"),
	});
	if (!user) throw new AppError("User not found", 404);
	response.json({ success: true, data: user });
});

router.patch("/:id", async (request, response) => {
	const allowed = ["name", "phone", "area", "bio", "photoURL"];
	const updates = Object.fromEntries(
		Object.entries(request.body).filter(
			([key, value]) => allowed.includes(key) && value !== undefined,
		),
	);

	if (!Object.keys(updates).length)
		throw new AppError("No profile fields were provided", 400);
	updates.updatedAt = new Date();

	const user = await collection().findOneAndUpdate(
		{ _id: objectId(request.params.id, "user id") },
		{ $set: updates },
		{ returnDocument: "after" },
	);
	if (!user) throw new AppError("User not found", 404);
	response.json({ success: true, data: user });
});

export default router;
