import dotenv from "dotenv";
dotenv.config();

// Centralized error handler
const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  const status = err.status || 500;
  const payload = {
    message: "An unexpected error occurred!",
  };
  if (process.env.NODE_ENV !== "production") {
    payload.error = err.message;
    payload.stack = err.stack;
  }
  res.status(status).json(payload);
};

export default errorHandler;
