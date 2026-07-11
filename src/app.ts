import express from "express";

import authRoutes from "./routes/auth.routes";
import taskRoutes from "./routes/tasks.routes";

const app = express();

app.use(express.json());
app.use("/auth", authRoutes);
app.use("/tasks", taskRoutes);

app.get("/", (_req, res) => {
  res.json({ message: "Task Manager API is running 🚀" });
});

export default app;
