import { Router } from "express";
import { getDatabase } from "../config/db.js";
import { AppError } from "../utils/errors.js";
import { ObjectId } from "mongodb";

const router = Router();
const collection = () => getDatabase().collection("user");

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
		_id: new ObjectId(request.params.id),
	});
	if (!user) throw new AppError("User not found", 404);
	response.json({ success: true, data: user });
});

export default router;
