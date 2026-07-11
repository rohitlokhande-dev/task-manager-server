import type { Response } from "express";

import prisma from "../config/prisma";
import type { AuthRequest } from "../middleware/auth";

const getUserId = (req: AuthRequest, res: Response): number | null => {
  if (req.user) {
    return req.user.id;
  }

  res.status(401).json({ error: "Unauthorized" });
  return null;
};

const getTaskId = (id: unknown): number | null => {
  if (typeof id !== "string") {
    return null;
  }

  const taskId = Number(id);
  return Number.isSafeInteger(taskId) && taskId > 0 ? taskId : null;
};

const getOwnedTask = (id: number, userId: number) =>
  prisma.task.findFirst({ where: { id, userId } });

export const createTask = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = getUserId(req, res);
  if (userId === null) return;

  const { title, description, completed } = req.body;
  if (typeof title !== "string" || !title.trim()) {
    res.status(400).json({ error: "Title is required" });
    return;
  }

  const task = await prisma.task.create({
    data: {
      title: title.trim(),
      description: typeof description === "string" ? description : undefined,
      completed: typeof completed === "boolean" ? completed : false,
      userId,
    },
  });

  res.status(201).json(task);
};

export const getTasks = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = getUserId(req, res);
  if (userId === null) return;

  const tasks = await prisma.task.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  res.status(200).json(tasks);
};

export const updateTask = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = getUserId(req, res);
  if (userId === null) return;

  const taskId = getTaskId(req.params.id);
  if (taskId === null) {
    res.status(400).json({ error: "Invalid task ID" });
    return;
  }

  const task = await getOwnedTask(taskId, userId);
  if (!task) {
    res.status(404).json({ error: "Task not found" });
    return;
  }

  const { title, description, completed } = req.body;
  if (title !== undefined && (typeof title !== "string" || !title.trim())) {
    res.status(400).json({ error: "Title cannot be empty" });
    return;
  }

  const updatedTask = await prisma.task.update({
    where: { id: taskId },
    data: {
      title: typeof title === "string" ? title.trim() : task.title,
      description: typeof description === "string" ? description : task.description,
      completed: typeof completed === "boolean" ? completed : task.completed,
    },
  });

  res.status(200).json(updatedTask);
};

export const deleteTask = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = getUserId(req, res);
  if (userId === null) return;

  const taskId = getTaskId(req.params.id);
  if (taskId === null) {
    res.status(400).json({ error: "Invalid task ID" });
    return;
  }

  const task = await getOwnedTask(taskId, userId);
  if (!task) {
    res.status(404).json({ error: "Task not found" });
    return;
  }

  await prisma.task.delete({ where: { id: taskId } });
  res.sendStatus(204);
};
