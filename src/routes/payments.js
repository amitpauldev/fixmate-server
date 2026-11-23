import { Router } from "express";
import { ObjectId } from "mongodb";
import { getDatabase } from "../config/db.js";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const router = Router();

const payments = () => getDatabase().collection("payments");
const bookings = () => getDatabase().collection("bookings");

router.post("/checkout-verify", async (request, response) => {
	try {
		// Only allow trusted server-to-server requests
		if (
			request.headers["x-webhook-secret"] !== process.env.PAYMENT_WEBHOOK_SECRET
		) {
			return response.status(401).json({
				success: false,
				message: "Unauthorized",
			});
		}

		const { sessionId } = request.body;

		if (!sessionId) {
			return response.status(400).json({
				success: false,
				message: "Session ID is required",
			});
		}

		// Retrieve Checkout Session from Stripe
		const session = await stripe.checkout.sessions.retrieve(sessionId);

		if (session.payment_status !== "paid" || session.mode !== "payment") {
			return response.status(400).json({
				success: false,
				message: "Payment is not completed",
			});
		}

		const bookingId = session.metadata?.bookingId;

		if (!bookingId || !ObjectId.isValid(bookingId)) {
			return response.status(400).json({
				success: false,
				message: "Invalid booking reference",
			});
		}

		// Retrieve trusted booking information
		const booking = await bookings().findOne({
			_id: new ObjectId(bookingId),
		});

		if (!booking) {
			return response.status(404).json({
				success: false,
				message: "Booking not found",
			});
		}

		const existingPayment = await payments().findOne({
			stripeSessionId: session.id,
		});

		if (
			booking.status === "completed" &&
			booking.paymentStatus === "paid" &&
			existingPayment
		) {
			return response.status(200).json({
				success: true,
				message: "Payment already verified",
				data: existingPayment,
			});
		}

		if (booking.status !== "completed" || booking.paymentStatus !== "unpaid") {
			return response.status(400).json({
				success: false,
				message: "Booking is not eligible for payment",
			});
		}

		// Verify the charged amount against the booking
		const expectedAmount = Math.round(booking.finalAmount * 100);

		if (session.amount_total !== expectedAmount) {
			return response.status(400).json({
				success: false,
				message: "Payment amount mismatch",
			});
		}

		const transactionId =
			typeof session.payment_intent === "string"
				? session.payment_intent
				: session.payment_intent?.id;

		if (!transactionId) {
			return response.status(400).json({
				success: false,
				message: "Payment transaction not found",
			});
		}

		const payment = {
			bookingId: booking._id.toString(),
			serviceTitle: booking.serviceTitle,
			customerId: booking.customerId,
			customerName: booking.customerName,
			customerEmail: booking.customerEmail,
			technicianId: booking.technicianId,
			technicianName: booking.technicianName,
			technicianEmail: booking.technicianEmail,
			amount: session.amount_total / 100,
			currency: session.currency,
			transactionId,
			stripeSessionId: session.id,
			paymentStatus: "paid",
			paidAt: new Date().toISOString(),
		};

		// Prevent duplicate payment records
		await payments().updateOne(
			{ stripeSessionId: session.id },
			{ $setOnInsert: payment },
			{ upsert: true },
		);

		// Update booking payment status
		await bookings().updateOne(
			{
				_id: booking._id,
				paymentStatus: "unpaid",
			},
			{
				$set: {
					paymentStatus: "paid",
					paidAt: new Date().toISOString(),
					updatedAt: new Date().toISOString(),
				},
			},
		);

		return response.status(200).json({
			success: true,
			message: "Payment verified successfully",
			data: payment,
		});
	} catch (error) {
		console.error("Payment verification error:", error);

		return response.status(500).json({
			success: false,
			message: "Internal server error",
		});
	}
});

router.get("/", async (request, response) => {
	const { customerId, technicianId } = request.query;
	const filter = {};

	if (customerId) {
		filter.customerId = customerId;
	}

	if (technicianId) {
		filter.technicianId = technicianId;
	}

	try {
		const paymentsList = await payments().find(filter).toArray();
		return response.status(200).json({
			success: true,
			data: paymentsList,
		});
	} catch (error) {
		return response.status(500).json({
			success: false,
			message: "Internal server error",
		});
	}
});

export default router;
