import { Router } from "express";
import {
  listEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  listAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from "../controllers/eventController";
import {
  listVolunteers,
  createVolunteer,
  updateVolunteer,
  deleteVolunteer,
  listSponsors,
  createSponsor,
  updateSponsor,
  deleteSponsor,
  listInventory,
  createInventory,
  updateInventory,
  deleteInventory,
} from "../controllers/miscController";
import { protect, authorize } from "../middleware/auth";
import { validate } from "../middleware/validate";
import {
  eventSchema,
  announcementSchema,
  volunteerSchema,
  sponsorSchema,
  inventorySchema,
} from "../schemas";
import { UserRole } from "../constants";

const router = Router();

router.use(protect);
const siteAdmins = authorize(UserRole.SUPER_ADMIN, UserRole.COLLECTION_MANAGER);

// Events
router.get("/events", siteAdmins, listEvents);
router.post("/events", siteAdmins, validate(eventSchema), createEvent);
router.put("/events/:id", siteAdmins, validate(eventSchema.partial()), updateEvent);
router.delete("/events/:id", siteAdmins, deleteEvent);

// Announcements
router.get("/announcements", siteAdmins, listAnnouncements);
router.post("/announcements", siteAdmins, validate(announcementSchema), createAnnouncement);
router.put("/announcements/:id", siteAdmins, validate(announcementSchema.partial()), updateAnnouncement);
router.delete("/announcements/:id", siteAdmins, deleteAnnouncement);

// Volunteers
router.get("/volunteers", siteAdmins, listVolunteers);
router.post("/volunteers", siteAdmins, validate(volunteerSchema), createVolunteer);
router.put("/volunteers/:id", siteAdmins, validate(volunteerSchema.partial()), updateVolunteer);
router.delete("/volunteers/:id", siteAdmins, deleteVolunteer);

// Sponsors
router.get("/sponsors", siteAdmins, listSponsors);
router.post("/sponsors", siteAdmins, validate(sponsorSchema), createSponsor);
router.put("/sponsors/:id", siteAdmins, validate(sponsorSchema.partial()), updateSponsor);
router.delete("/sponsors/:id", siteAdmins, deleteSponsor);

// Inventory
router.get("/inventory", siteAdmins, listInventory);
router.post("/inventory", siteAdmins, validate(inventorySchema), createInventory);
router.put("/inventory/:id", siteAdmins, validate(inventorySchema.partial()), updateInventory);
router.delete("/inventory/:id", siteAdmins, deleteInventory);

export default router;
