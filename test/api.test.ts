import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";

const prisma = vi.hoisted(() => ({
  user: {
    create: vi.fn(),
    findUnique: vi.fn(),
  },
  task: {
    create: vi.fn(),
    delete: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock("../src/config/prisma", () => ({ default: prisma }));

import app from "../src/app";
import { signAccessToken } from "../src/utils/auth";

const user = {
  id: 1,
  name: "Rohit",
  email: "rohit@example.com",
  password: "$2b$12$RWq9NcRlQnOWCVFmLwKG3edkcTBuI.wX4Kty6op8fdrPvwVj0lzDm",
};

describe("Task Manager API", () => {
  beforeEach(() => {
    process.env.JWT_SECRET = "test-secret";
    vi.clearAllMocks();
  });

  describe("POST /auth/register", () => {
    it("creates an account and returns an access token", async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue(user);

      const response = await request(app).post("/auth/register").send({
        name: " Rohit ",
        email: " ROHIT@EXAMPLE.COM ",
        password: "safe-password",
      });

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        message: "User registered successfully.",
        user: { id: 1, name: "Rohit", email: "rohit@example.com" },
      });
      expect(response.body.token).toEqual(expect.any(String));
      expect(response.body.user.password).toBeUndefined();
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: "Rohit",
          email: "rohit@example.com",
        }),
      });
    });

    it("rejects a duplicate email", async () => {
      prisma.user.findUnique.mockResolvedValue(user);

      const response = await request(app).post("/auth/register").send({
        name: "Rohit",
        email: user.email,
        password: "safe-password",
      });

      expect(response.status).toBe(409);
      expect(response.body.message).toBe("An account with this email already exists.");
      expect(prisma.user.create).not.toHaveBeenCalled();
    });
  });

  describe("POST /auth/login", () => {
    it("rejects invalid credentials without revealing which field failed", async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const response = await request(app).post("/auth/login").send({
        email: user.email,
        password: "safe-password",
      });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({ message: "Invalid email or password." });
    });
  });

  describe("POST /tasks", () => {
    it("requires a bearer token", async () => {
      const response = await request(app).post("/tasks").send({ title: "Write tests" });

      expect(response.status).toBe(401);
      expect(prisma.task.create).not.toHaveBeenCalled();
    });

    it("creates a task for the user in the access token", async () => {
      const task = { id: 10, title: "Write tests", completed: false, userId: 1 };
      prisma.task.create.mockResolvedValue(task);

      const response = await request(app)
        .post("/tasks")
        .set("Authorization", `Bearer ${signAccessToken(1)}`)
        .send({ title: " Write tests " });

      expect(response.status).toBe(201);
      expect(response.body).toEqual(task);
      expect(prisma.task.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ title: "Write tests", userId: 1 }),
      });
    });
  });

  describe("PUT /tasks/:id", () => {
    it("does not allow a user to update another user's task", async () => {
      prisma.task.findFirst.mockResolvedValue(null);

      const response = await request(app)
        .put("/tasks/10")
        .set("Authorization", `Bearer ${signAccessToken(1)}`)
        .send({ title: "Change title" });

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: "Task not found" });
      expect(prisma.task.update).not.toHaveBeenCalled();
    });
  });
});
