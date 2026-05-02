import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "TeamSync API is healthy" });
  });

  // Example REST endpoint
  app.get("/api/info", (req, res) => {
    res.json({
      name: "TeamSync Task Manager",
      version: "1.0.0",
      description: "Full-stack collaborative task management",
    });
  });

  app.get("/api/workspace/tips", (req, res) => {
    const tips = [
      "Use 'Filter' to focus on high-priority objectives.",
      "Assign tasks to specific team members for better accountability.",
      "Keep descriptions concise but actionable.",
      "Regularly review 'In Progress' columns for blockers."
    ];
    const randomTip = tips[Math.floor(Math.random() * tips.length)];
    res.json({ tip: randomTip, timestamp: new Date().toISOString() });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
