import dotenv from "dotenv";

dotenv.config();

export const env = {
  port: Number(process.env.PORT) || 5000,
  nodeEnv: process.env.NODE_ENV || "development",
  mongoUri: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/SVGB_Ganesha_2026",
  jwtSecret: process.env.JWT_SECRET || "dev-secret-change-me",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
  publicBaseUrl: process.env.PUBLIC_BASE_URL || "http://localhost:5173",
  org: {
    name: process.env.ORG_NAME || "SVGB",
    fullName: process.env.ORG_FULL_NAME || "Siddi Vinayaka Geleyara Balaga",
    tagline: process.env.ORG_TAGLINE || "Siddi Vinayaka Geleyara Balaga",
    festivalName: process.env.FESTIVAL_NAME || "Ganesh Chaturthi 2026",
    festivalYear: process.env.FESTIVAL_YEAR || "2026",
    receiptPrefix: process.env.RECEIPT_PREFIX || "SVGB",
  },
};
