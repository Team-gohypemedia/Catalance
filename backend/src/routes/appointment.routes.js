import { Router } from "express";
import {
    getManagerAvailability,
    setManagerAvailability,
    deleteAvailabilitySlot,
    getAvailableSlots,
    bookAppointment,
    getAppointments,
    updateAppointmentStatus,
    cancelAppointment,
    getManagers,
} from "../controllers/appointment.controller.js";
import { requireAuth } from "../middlewares/require-auth.js";

export const appointmentRouter = Router();

// ==================== MANAGER AVAILABILITY ====================

// Get manager's availability (public - for booking UI)
appointmentRouter.get("/availability", getManagerAvailability);

// Set manager's availability slots (manager only)
appointmentRouter.post("/availability", requireAuth, setManagerAvailability);

// Delete an availability slot (manager only)
appointmentRouter.delete("/availability/:id", requireAuth, deleteAvailabilitySlot);

// Get available slots for a specific date (for booking)
appointmentRouter.get("/slots", getAvailableSlots);

// ==================== APPOINTMENTS ====================

// Get all managers (for booking dropdown)
appointmentRouter.get("/managers", getManagers);

// Get appointments
appointmentRouter.get("/", requireAuth, getAppointments);

// Book an appointment (freelancer/client)
appointmentRouter.post("/", requireAuth, bookAppointment);

// Update appointment status (approve/reject - manager only)
appointmentRouter.patch("/:id/status", requireAuth, updateAppointmentStatus);

// Cancel an appointment (by booker)
appointmentRouter.post("/:id/cancel", requireAuth, cancelAppointment);
