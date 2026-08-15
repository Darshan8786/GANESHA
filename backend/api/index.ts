import { Request, Response } from "express";
import { app } from "../src/app";
import { connectDB } from "../src/config/db";

let dbStarted = false;

export default function handler(req: Request, res: Response) {
  if (!dbStarted) {
    dbStarted = true;
    connectDB().catch((err) => {
      console.error("[db] connection error:", err instanceof Error ? err.message : err);
    });
  }
  return app(req, res);
}
