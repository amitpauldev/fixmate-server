import { Router } from "express";
import { getDatabase } from "../config/db.js";
import { AppError, objectId } from "../utils/errors.js";

const router = Router();
const bookings = () => getDatabase().collection("bookings");
const services = () => getDatabase().collection("services");
const transitions = {
  requested: ["accepted", "rejected", "cancelled"],
  accepted: ["in-progress", "cancelled"],
  "in-progress": ["completed"],
  completed: [],
  rejected: [],
  cancelled: [],
};

router.post("/", async (request, response) => {
  const { customerId, serviceId, scheduledDate, address, notes = "" } = request.body;
  if (!customerId || !serviceId || !scheduledDate || !address) {
    throw new AppError("Customer, service, scheduled date, and address are required", 400);
  }

  const service = await services().findOne({
    _id: objectId(serviceId, "service id"),
    approvalStatus: "approved",
    isAvailable: true,
  });
  if (!service) throw new AppError("Approved and available service not found", 404);

  const booking = {
    customerId,
    technicianId: service.technicianId,
    serviceId: service._id,
    serviceTitle: service.title,
    scheduledDate,
    address,
    notes,
    finalAmount: service.price,
    status: "requested",
    paymentStatus: "unpaid",
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const result = await bookings().insertOne(booking);
  response.status(201).json({ success: true, data: { ...booking, _id: result.insertedId } });
});

router.get("/", async (request, response) => {
  const filter = {};
  if (request.query.customerId) filter.customerId = request.query.customerId;
  if (request.query.technicianId) filter.technicianId = request.query.technicianId;
  if (request.query.status) filter.status = request.query.status;
  const result = await bookings().find(filter).sort({ createdAt: -1 }).toArray();
  response.json({ success: true, data: result });
});

router.patch("/:id/status", async (request, response) => {
  const bookingId = objectId(request.params.id, "booking id");
  const booking = await bookings().findOne({ _id: bookingId });
  if (!booking) throw new AppError("Booking not found", 404);
  if (!transitions[booking.status]?.includes(request.body.status)) {
    throw new AppError(`Cannot change booking status from ${booking.status} to ${request.body.status}`, 400);
  }

  const updated = await bookings().findOneAndUpdate(
    { _id: bookingId },
    { $set: { status: request.body.status, updatedAt: new Date() } },
    { returnDocument: "after" },
  );
  response.json({ success: true, data: updated });
});

router.post("/:id/cancel", async (request, response) => {
  request.body.status = "cancelled";
  const bookingId = objectId(request.params.id, "booking id");
  const booking = await bookings().findOne({ _id: bookingId });
  if (!booking) throw new AppError("Booking not found", 404);
  if (!transitions[booking.status]?.includes("cancelled")) {
    throw new AppError(`Cannot cancel a ${booking.status} booking`, 400);
  }
  const updated = await bookings().findOneAndUpdate(
    { _id: bookingId },
    { $set: { status: "cancelled", updatedAt: new Date() } },
    { returnDocument: "after" },
  );
  response.json({ success: true, data: updated });
});

export default router;
