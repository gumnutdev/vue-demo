/**
 * @fileoverview A simple, single-file Node.js HTTP server in TypeScript
 * that manages a list of "Widgets" and proxies all other requests
 * to a frontend development server. It uses ES module syntax and a
 * JSON file for data persistence.
 *
 * @author Gemini
 * @version 1.1.0
 *
 * To run this server:
 * 1. Save this file as `server.ts`.
 * 2. Make sure you have Node.js, npm, and TypeScript installed.
 * 3. In your terminal, in the same directory, run `npm init -y`.
 * 4. Set the module type in `package.json` by adding the line: "type": "module"
 * 5. Install dependencies: `npm install typescript ts-node @types/node --save-dev`
 * 6. Create an empty file named `database.json` or add some initial data like:
 * [
 * { "id": 1, "name": "Initial Widget", "color": "blue" }
 * ]
 * 7. Run this server: `npx ts-node server.ts`
 * 8. In a separate terminal, run your frontend dev server (e.g., Vite) on port 5173.
 *
 * The server will start on http://localhost:3000.
 *
 * API Endpoints:
 * - GET /widgets
 * - Fetches all widgets.
 * - curl http://localhost:3000/widgets
 *
 * - POST /widgets
 * - Creates a new widget or updates an existing one.
 * - curl -X POST -H "Content-Type: application/json" -d '{"name":"New","color":"red"}' http://localhost:3000/widgets
 *
 * All other requests (e.g., to `/`, `/about`, static assets) will be proxied
 * to http://localhost:5173.
 */

// Node.js built-in modules
import http from 'http';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// --- TYPE DEFINITIONS ---

interface Widget {
  id: number;
  name: string;
  color: string;
}

// --- CONFIGURATION & SETUP ---

const PORT = 3000;
const PROXY_HOST = 'localhost';
const PROXY_PORT = 5173;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, 'database.json');

// In-memory cache for our widget data.
let widgetCache: Widget[] = [];

// --- DATABASE HELPER FUNCTIONS ---

/**
 * Reads the content of the database.json file and parses it.
 * @returns A promise that resolves to an array of Widgets.
 */
async function loadDatabase(): Promise<Widget[]> {
  try {
    const data = await fs.readFile(DB_PATH, 'utf-8');
    return data ? (JSON.parse(data) as Widget[]) : [];
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      console.log('database.json not found. It will be created on the first write.');
      return [];
    }
    console.error('Error reading or parsing database:', error);
    process.exit(1);
  }
}

/**
 * Writes the given array of widgets to the database.json file.
 * @param data The array of Widgets to save.
 */
async function saveDatabase(data: Widget[]): Promise<void> {
  try {
    await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing to database:', error);
  }
}

/**
 * A helper function to parse the JSON body from an incoming request.
 * @param req The HTTP request object.
 * @returns A promise that resolves to the parsed JSON body.
 */
function parseRequestBody(req: http.IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(new Error('Invalid JSON in request body'));
      }
    });
    req.on('error', (err) => {
      reject(err);
    });
  });
}

// --- PROXY FUNCTION ---

/**
 * Forwards the request to the frontend development server.
 * @param req The original incoming request.
 * @param res The original server response.
 */
function proxyRequest(req: http.IncomingMessage, res: http.ServerResponse) {
  const options = {
    hostname: PROXY_HOST,
    port: PROXY_PORT,
    path: req.url,
    method: req.method,
    headers: req.headers,
  };

  const proxyReq = http.request(options, (proxyRes) => {
    // Write the headers from the proxy response to the original response
    res.writeHead(proxyRes.statusCode || 500, proxyRes.headers);
    // Pipe the body of the proxy response to the original response
    proxyRes.pipe(res, { end: true });
  });

  proxyReq.on('error', (err) => {
    console.error(`Proxy Error: ${err.message}`);
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'Bad Gateway - Is the frontend server running?' }));
  });

  // Pipe the body of the original request to the proxy request
  req.pipe(proxyReq, { end: true });
}

// --- HTTP SERVER LOGIC ---

const server = http.createServer(async (req, res) => {
  const { method, url } = req;
  // We only need the pathname for routing our API endpoints.
  // The full URL (including query params) will be passed to the proxy.
  const pathname = new URL(url || '', `http://${req.headers.host}`).pathname;

  // --- API ROUTES ---
  if (pathname.startsWith('/widgets')) {
    try {
      // --- ROUTE: GET /widgets ---
      if (pathname === '/widgets' && method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(widgetCache));
        return;
      }

      // --- ROUTE: POST /widgets ---
      if (pathname === '/widgets' && method === 'POST') {
        const body = (await parseRequestBody(req)) as Partial<Widget>;

        if (!body.name || !body.color) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: 'Bad Request: "name" and "color" are required.' }));
          return;
        }

        // UPDATE existing widget
        if (body.id) {
          const widgetIndex = widgetCache.findIndex((w) => w.id === body.id);
          if (widgetIndex > -1) {
            const updatedWidget = { ...widgetCache[widgetIndex], ...body };
            widgetCache[widgetIndex] = updatedWidget;
            await saveDatabase(widgetCache);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(updatedWidget));
          } else {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: `Widget with id ${body.id} not found.` }));
          }
        }
        // CREATE new widget
        else {
          const newId = widgetCache.length > 0 ? Math.max(...widgetCache.map((w) => w.id)) + 1 : 1;
          const newWidget: Widget = { id: newId, name: body.name, color: body.color };
          widgetCache.push(newWidget);
          await saveDatabase(widgetCache);
          res.writeHead(201, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(newWidget));
        }
        return;
      }
    } catch (error: any) {
      console.error('API Error:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Internal Server Error', error: error.message }));
      return;
    }
  }

  // --- PROXY all other requests ---
  // If the request was not for our API, proxy it.
  proxyRequest(req, res);
});

// --- START THE SERVER ---

async function startServer() {
  widgetCache = await loadDatabase();
  console.log(`Loaded ${widgetCache.length} widgets from the database.`);

  server.listen(PORT, () => {
    console.log(`🚀 API server listening on http://localhost:${PORT}`);
    console.log(`📡 Proxying unhandled requests to http://${PROXY_HOST}:${PROXY_PORT}`);
  });
}

startServer();
