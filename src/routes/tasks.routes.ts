import { Router } from "express";

import {
  createTask,
  deleteTask,
  getTasks,
  updateTask,
} from "../controllers/tasks.controllers";
import { authenticate } from "../middleware/auth";

const router = Router();

router.get("/", authenticate, getTasks);
router.post("/", authenticate, createTask);
router.put("/:id", authenticate, updateTask);
router.delete("/:id", authenticate, deleteTask);

export default router;
