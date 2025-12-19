import express from "express";
import {
  createUser,
  deleteUser,
  getAllUsers,
  getUserById,
  updateUser,
} from "../controller/userController.js";
import {
  validateUser,
  validateUpdadeUser,
} from "../middlewares/inputValidator.js";

const router = express.Router();

router.get("/user", getAllUsers);
router.get("/user/:id", getUserById);
router.post("/user", validateUser, createUser);
router.put("/user/:id", validateUpdadeUser, updateUser);
router.delete("/user/:id", deleteUser);

export default router;
