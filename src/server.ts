import dotenv from "dotenv";

import app from "./app";
import { env } from "./config/env";

dotenv.config();

app.listen(env.port, () => {
  console.log(`Server is running at http://localhost:${env.port}`);
});
