import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import axios from "axios";

async function startServer() {
  const app = express();
  app.use(express.json());
  const PORT = 3000;

  // API routes
  app.post("/api/chat", async (req, res) => {
    const { messages } = req.body;
    try {
      const response = await axios.post("https://tabitoken.com/v1/chat/completions", {
        model: "claude-opus-5-thinking",
        messages
      }, {
        headers: {
          "Authorization": `Bearer ${process.env.TABITOKEN_API_KEY}`,
          "Content-Type": "application/json"
        }
      });
      res.json(response.data);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        console.error("API Error Response:", error.response.data);
        res.status(error.response.status).json({ error: error.response.data });
      } else {
        console.error("API Error:", error);
        res.status(500).json({ error: "Failed to fetch from API" });
      }
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
