import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import http from "http";
import { env } from "./config/env.js";
import { apiRouter } from "./routes/index.js";
import { errorHandler } from "./middlewares/error-handler.js";
import { notFoundHandler } from "./middlewares/not-found.js";
import { initSocket } from "./lib/socket.js";

const app = express();

// Middlewares
app.use(helmet({
  crossOriginResourcePolicy: false,
}));

app.use(cors({
  origin: true,
  credentials: true
}));

app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api", apiRouter);

// Error handlers
app.use(notFoundHandler);
app.use(errorHandler);

const server = http.createServer(app);

// Sockets
initSocket(server);

const PORT = env.PORT || 5000;

if (process.env.NODE_ENV !== "test") {
  server.listen(PORT, () => {
    console.log(`API server ready on http://localhost:${PORT}`);
  });
}

export default app;
