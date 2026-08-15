import { Request, Response, NextFunction } from "express";

export function notFound(req: Request, res: Response): void {
  res.status(404).json({ message: `Route not found: ${req.originalUrl}` });
}

export function errorHandler(
  err: Error & { statusCode?: number; code?: number; errors?: Record<string, unknown> },
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err.code === 11000) {
    res.status(409).json({ message: "Duplicate value error: record already exists" });
    return;
  }
  if (err.name === "ValidationError") {
    const msg = err.errors ? Object.values(err.errors).map((e) => (e as { message?: string }).message).join(", ") : "Validation error";
    res.status(400).json({ message: msg });
    return;
  }
  const status = err.statusCode || 500;
  res.status(status).json({ message: err.message || "Server error" });
}
