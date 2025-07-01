/**
 * @fileoverview A simple, single-file Node.js HTTP server in TypeScript
 * that manages a list of engineering "Pipes" and proxies all other requests
 * to a frontend development server. It uses ES module syntax and a
 * JSON file for data persistence.
 *
 * @author Gemini
 * @version 1.4.0
 *
 * To run this server:
 * 1. Save this file as `server.ts`.
 * 2. Make sure you have Node.js, npm, and TypeScript installed.
 * 3. In your terminal, in the same directory, run `npm init -y`.
 * 4. Set the module type in `package.json` by adding the line: "type": "module"
 * 5. Install dependencies: `npm install typescript ts-node @types/node --save-dev`
 * 6. Create an empty `database.json` file.
 * 7. Run this server: `npx ts-node server.ts`
 * 8. In a separate terminal, run your frontend dev server (e.g., Vite) on port 5173.
 *
 * The server will start on http://localhost:3000.
 *
 * API Endpoints:
 * - GET /pipes
 * - Fetches all pipes.
 * - curl http://localhost:3000/pipes
 *
 * - POST /pipes
 * - Creates a new pipe or updates an existing one. All fields are optional.
 * - Example Create:
 * curl -X POST -H "Content-Type: application/json" -d '{"material": "Stainless Steel", "description": "Initial entry for new pipeline section."}' http://localhost:3000/pipes
 *
 * All other requests will be proxied to http://localhost:5173.
 */

// Node.js built-in modules
import http from 'http';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// --- TYPE DEFINITIONS ---

interface Pipe {
  id: number;
  description?: string; // Free text description
  diameter?: number; // in millimeters
  material?: string; // e.g., 'Carbon Steel', 'PVC', 'Copper'
  length?: number; // in meters
  pressureRating?: number; // in PSI (Pounds per Square Inch)
  schedule?: string; // e.g., 'SCH 40', 'SCH 80'
  materialGrade?: string; // e.g., 'A106-B', '316L'
  tensileStrength?: number; // in MPa (Megapascals)
  yieldStrength?: number; // in MPa (Megapascals)
  hardness?: string; // e.g., '150 HB' (Brinell Hardness)
  ringCrushStrength?: number; // in kN/m (kilonewtons per meter)
  coating?: string; // e.g., 'FBE' (Fusion Bonded Epoxy), 'Galvanized', 'None'
  insulationThickness?: number; // in millimeters
}

// --- CONFIGURATION & SETUP ---

const PORT = 3000;
const PROXY_HOST = 'localhost';
const PROXY_PORT = 5173;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, 'database.json');

// In-memory cache for our pipe data.
let pipeCache: Pipe[] = [];

// --- DATABASE HELPER FUNCTIONS ---

/**
 * Reads the content of the database.json file and parses it.
 * @returns A promise that resolves to an array of Pipes.
 */
async function loadDatabase(): Promise<Pipe[]> {
  try {
    const data = await fs.readFile(DB_PATH, 'utf-8');
    return data ? (JSON.parse(data) as Pipe[]) : [];
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
 * Writes the given array of pipes to the database.json file.
 * @param data The array of Pipes to save.
 */
async function saveDatabase(data: Pipe[]): Promise<void> {
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
    res.writeHead(proxyRes.statusCode || 500, proxyRes.headers);
    proxyRes.pipe(res, { end: true });
  });

  proxyReq.on('error', (err) => {
    console.error(`Proxy Error: ${err.message}`);
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'Bad Gateway - Is the frontend server running?' }));
  });

  req.pipe(proxyReq, { end: true });
}

// --- HTTP SERVER LOGIC ---

const server = http.createServer(async (req, res) => {
  const { method, url } = req;
  const pathname = new URL(url || '', `http://${req.headers.host}`).pathname;

  // --- API ROUTES ---
  if (pathname.startsWith('/pipes')) {
    try {
      // --- ROUTE: GET /pipes ---
      if (pathname === '/pipes' && method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(pipeCache));
        return;
      }

      // --- ROUTE: POST /pipes ---
      if (pathname === '/pipes' && method === 'POST') {
        const body = (await parseRequestBody(req)) as Partial<Pipe>;

        // UPDATE existing pipe
        if (body.id) {
          const pipeIndex = pipeCache.findIndex((p) => p.id === body.id);
          if (pipeIndex > -1) {
            // Merge existing data with new data
            const updatedPipe = { ...pipeCache[pipeIndex], ...body };
            pipeCache[pipeIndex] = updatedPipe;
            await saveDatabase(pipeCache);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(updatedPipe));
          } else {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: `Pipe with id ${body.id} not found.` }));
          }
        }
        // CREATE new pipe
        else {
          const newId = pipeCache.length > 0 ? Math.max(...pipeCache.map((p) => p.id)) + 1 : 1;

          // Create a new pipe object with the provided body and a new ID.
          // All fields are optional, so we don't need to check for them or provide defaults.
          const newPipe: Pipe = {
            id: newId,
            ...body,
          };

          pipeCache.push(newPipe);
          await saveDatabase(pipeCache);
          res.writeHead(201, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(newPipe));
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
  proxyRequest(req, res);
});

// --- START THE SERVER ---

async function startServer() {
  pipeCache = await loadDatabase();
  console.log(`Loaded ${pipeCache.length} pipes from the database.`);

  server.listen(PORT, () => {
    console.log(`🚀 API server listening on http://localhost:${PORT}`);
    console.log(`📡 Proxying unhandled requests to http://${PROXY_HOST}:${PROXY_PORT}`);
  });
}

startServer();
