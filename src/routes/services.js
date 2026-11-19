import { Router } from "express";
import { getDatabase } from "../config/db.js";
import { AppError, objectId } from "../utils/errors.js";

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

  const sortBy = sort === "price-asc" ? { price: 1 } : sort === "price-desc" ? { price: -1 } : { createdAt: -1 };
  const services = await collection().find(filter).sort(sortBy).toArray();
  response.json({ success: true, data: services });
});

router.get("/:id", async (request, response) => {
  const service = await collection().findOne({
    _id: objectId(request.params.id, "service id"),
    approvalStatus: "approved",
    isAvailable: true,
  });
  if (!service) throw new AppError("Service not found", 404);
  response.json({ success: true, data: service });
});

router.post("/", async (request, response) => {
  const required = ["technicianId", "title", "category", "description", "price", "area"];
  if (required.some((field) => request.body[field] === undefined || request.body[field] === "")) {
    throw new AppError("Technician, title, category, description, price, and area are required", 400);
  }

  const price = Number(request.body.price);
  if (!Number.isFinite(price) || price < 0) throw new AppError("Price must be a non-negative number", 400);

  const service = {
    technicianId: request.body.technicianId,
    title: request.body.title,
    category: request.body.category,
    description: request.body.description,
    price,
    area: request.body.area,
    image: request.body.image || "",
    isAvailable: request.body.isAvailable !== false,
    approvalStatus: "pending",
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const result = await collection().insertOne(service);
  response.status(201).json({ success: true, data: { ...service, _id: result.insertedId } });
});

router.patch("/:id", async (request, response) => {
  const allowed = ["title", "category", "description", "price", "area", "image", "isAvailable"];
  const updates = Object.fromEntries(
    Object.entries(request.body).filter(([key, value]) => allowed.includes(key) && value !== undefined),
  );
  if (!Object.keys(updates).length) throw new AppError("No service fields were provided", 400);
  if (updates.price !== undefined) updates.price = Number(updates.price);
  if (updates.price !== undefined && (!Number.isFinite(updates.price) || updates.price < 0)) {
    throw new AppError("Price must be a non-negative number", 400);
  }

  updates.approvalStatus = "pending";
  updates.updatedAt = new Date();
  const service = await collection().findOneAndUpdate(
    { _id: objectId(request.params.id, "service id") },
    { $set: updates },
    { returnDocument: "after" },
  );
  if (!service) throw new AppError("Service not found", 404);
  response.json({ success: true, data: service });
});

router.delete("/:id", async (request, response) => {
  const result = await collection().deleteOne({ _id: objectId(request.params.id, "service id") });
  if (!result.deletedCount) throw new AppError("Service not found", 404);
  response.status(204).send();
});

export default router;
