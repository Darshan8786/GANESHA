import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { User } from "./models/User";
import { Area } from "./models/Area";
import { House } from "./models/House";
import { Shop } from "./models/Shop";
import { Event } from "./models/Event";
import { Announcement } from "./models/Announcement";
import { UserRole, HouseStatus } from "./constants";
import { env } from "./config/env";

dotenv.config();

/**
 * Non-destructive seed: creates the single administrator account plus sample
 * areas/houses/shops/events only when they do not already exist. It never
 * deletes any data.
 */
async function seed() {
  await mongoose.connect(env.mongoUri);
  console.log(`Connected. Database: ${mongoose.connection.name}`);

  const password = process.env.SEED_ADMIN_PASSWORD || "Admin@123";
  const hashed = await bcrypt.hash(password, 10);

  const adminEmail = process.env.SEED_ADMIN_EMAIL || "admin@svgb.org";
  const admin = await User.findOneAndUpdate(
    { email: adminEmail },
    { $setOnInsert: { name: "Administrator", phone: "9000000001", password: hashed, role: UserRole.SUPER_ADMIN, isActive: true } },
    { upsert: true, new: true }
  );
  console.log(`Admin account ready: ${admin?.email} (SUPER_ADMIN)`);
  if (!admin) return;

  const areaNames = ["Whitefield Main Road", "1st Cross", "2nd Cross", "3rd Cross", "Hoodi", "Marathahalli Road"];
  const existingAreas = await Area.find({ name: { $in: areaNames } }).lean();
  if (existingAreas.length === 0) {
    await Area.insertMany(areaNames.map((name) => ({ name, description: `Area: ${name}` })));
    console.log("Sample areas inserted");
  } else {
    console.log("Areas already exist — skipped sample areas");
  }
  const allAreas = await Area.find({ name: { $in: areaNames } }).lean();
  const areaByName = new Map(allAreas.map((a) => [a.name, a._id]));

  const [a1, a2, a3, a4, a5, a6] = areaNames.map((n) => areaByName.get(n));

  if ((await House.countDocuments()) === 0) {
    await House.insertMany([
      { houseId: "H-001", ownerName: "N Pillappa", phone: "9845012345", address: "#23, 2nd Cross", area: a2, street: "2nd Cross", houseNumber: "23", previousYearDonation: 5000, status: HouseStatus.NOT_VISITED, assignedCollector: admin._id },
      { houseId: "H-002", ownerName: "Ramesh Gowda", phone: "9845023456", address: "#12, 1st Cross", area: a2, street: "1st Cross", houseNumber: "12", previousYearDonation: 2000, status: HouseStatus.COLLECTED, currentYearDonation: 2000, assignedCollector: admin._id },
      { houseId: "H-003", ownerName: "Kavitha Reddy", phone: "9845034567", address: "#45, Whitefield Main Road", area: a1, street: "Whitefield Main Road", houseNumber: "45", previousYearDonation: 10000, status: HouseStatus.WILL_PAY_LATER, assignedCollector: admin._id },
      { houseId: "H-004", ownerName: "Suresh Kumar", phone: "9845045678", address: "#8, Hoodi", area: a5, street: "Hoodi", houseNumber: "8", previousYearDonation: 3000, status: HouseStatus.NOT_AVAILABLE, assignedCollector: admin._id },
      { houseId: "H-005", ownerName: "Anitha Rao", phone: "9845056789", address: "#67, 3rd Cross", area: a3, street: "3rd Cross", houseNumber: "67", previousYearDonation: 1500, status: HouseStatus.COLLECTED, currentYearDonation: 1500, assignedCollector: admin._id },
      { houseId: "H-006", ownerName: "Mohan Das", phone: "9845067890", address: "#90, Marathahalli Road", area: a6, street: "Marathahalli Road", houseNumber: "90", previousYearDonation: 500, status: HouseStatus.REFUSED, assignedCollector: admin._id },
      { houseId: "H-007", ownerName: "Lakshmi Devi", phone: "9845078901", address: "#14, Hoodi", area: a5, street: "Hoodi", houseNumber: "14", previousYearDonation: 2000, status: HouseStatus.NOT_VISITED, assignedCollector: admin._id },
      { houseId: "H-008", ownerName: "Venkatesh Iyer", phone: "9845089012", address: "#33, 1st Cross", area: a2, street: "1st Cross", houseNumber: "33", previousYearDonation: 4000, status: HouseStatus.NOT_VISITED, assignedCollector: admin._id },
    ]);
    console.log("Sample houses inserted");
  } else {
    console.log("Houses already exist — skipped sample houses");
  }

  if ((await Shop.countDocuments()) === 0) {
    await Shop.insertMany([
      { shopId: "S-001", shopName: "Sri Lakshmi Stores", ownerName: "Lakshmi Narayana", phone: "9845090123", address: "Main Road", area: a1, street: "Whitefield Main Road", previousDonation: 10000, status: HouseStatus.COLLECTED, currentDonation: 10000, assignedCollector: admin._id },
      { shopId: "S-002", shopName: "Balaji Provision", ownerName: "Balaji", phone: "9845101234", address: "2nd Cross", area: a2, street: "2nd Cross", previousDonation: 5000, status: HouseStatus.NOT_VISITED, assignedCollector: admin._id },
      { shopId: "S-003", shopName: "Ganesh Sweets", ownerName: "Ganesh Kumar", phone: "9845112345", address: "Hoodi Circle", area: a5, street: "Hoodi", previousDonation: 8000, status: HouseStatus.WILL_PAY_LATER, assignedCollector: admin._id },
      { shopId: "S-004", shopName: "Rajalakshmi Textiles", ownerName: "Raja", phone: "9845123456", address: "Marathahalli Road", area: a6, street: "Marathahalli Road", previousDonation: 15000, status: HouseStatus.NOT_AVAILABLE, assignedCollector: admin._id },
    ]);
    console.log("Sample shops inserted");
  } else {
    console.log("Shops already exist — skipped sample shops");
  }

  if ((await Event.countDocuments()) === 0) {
    await Event.insertMany([
      { name: "Ganesha Installation", date: new Date("2026-09-19"), startTime: "10:00", endTime: "12:00", location: "Main Pandhal", description: "Installation of Lord Ganesha idol" },
      { name: "Morning Pooja", date: new Date("2026-09-20"), startTime: "08:00", endTime: "09:30", location: "Main Pandhal", description: "Daily morning pooja" },
      { name: "Cultural Program", date: new Date("2026-09-21"), startTime: "19:00", endTime: "22:00", location: "Community Ground", description: "Evening cultural performances" },
      { name: "Mahaprasada", date: new Date("2026-09-22"), startTime: "13:00", endTime: "15:00", location: "Community Hall", description: "Grand feast for all devotees" },
      { name: "Procession", date: new Date("2026-09-28"), startTime: "16:00", endTime: "18:00", location: "Streets of Whitefield", description: "Final procession" },
      { name: "Visarjan", date: new Date("2026-09-28"), startTime: "18:00", endTime: "20:00", location: "Water body", description: "Ganesha Visarjan" },
    ]);
    console.log("Sample events inserted");
  } else {
    console.log("Events already exist — skipped sample events");
  }

  if ((await Announcement.countDocuments()) === 0) {
    await Announcement.insertMany([
      { title: "Collection Drive", message: "Door to door collection is ongoing. Please support generously." },
      { title: "Visarjan Notice", message: "Ganesh Visarjan will begin at 4:00 PM on Sunday." },
    ]);
    console.log("Sample announcements inserted");
  } else {
    console.log("Announcements already exist — skipped sample announcements");
  }

  console.log("Seed complete.");
  await mongoose.disconnect();
}

seed()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });