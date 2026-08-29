const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT']
  }
});

const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'buses.json');

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── In-Memory State ──────────────────────────────────────────────
// Active buses sharing location: { [busId]: { busId, lat, lng, socketId, routeId, speed, accuracy, timestamp } }
const activeBuses = {};

// ── Helper: Read/Write bus data ──────────────────────────────────
function readRoutes() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, '[]', 'utf8');
      return [];
    }
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading routes:', err.message);
    return [];
  }
}

function writeRoutes(routes) {
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(routes, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing routes:', err.message);
  }
}

// Format stops to standardized array format
function formatStops(stops, from, to) {
  if (Array.isArray(stops) && stops.length > 0) {
    return stops.map(s => {
      if (typeof s === 'string') return { name: s.trim() };
      if (typeof s === 'object' && s && s.name) return s;
      return { name: String(s) };
    });
  }
  return [{ name: from }, { name: to }];
}

// ── REST API ─────────────────────────────────────────────────────

// Get all routes with live bus count
app.get('/api/routes', (req, res) => {
  const routes = readRoutes();
  const routesWithCount = routes.map(route => ({
    ...route,
    activeBuses: Object.values(activeBuses).filter(b => b.routeId === route.id).length
  }));
  res.json(routesWithCount);
});

// Get single route details
app.get('/api/routes/:id', (req, res) => {
  const routes = readRoutes();
  const route = routes.find(r => r.id === req.params.id);
  if (!route) return res.status(404).json({ error: 'Route not found' });

  const buses = Object.entries(activeBuses)
    .filter(([, b]) => b.routeId === route.id)
    .map(([busId, b]) => ({
      busId,
      lat: b.lat,
      lng: b.lng,
      speed: b.speed,
      accuracy: b.accuracy,
      timestamp: b.timestamp
    }));

  res.json({ ...route, buses });
});

// Add new route/bus
app.post('/api/routes', (req, res) => {
  const routes = readRoutes();
  const { busNumber, from, to, busType, operator, driverName, driverPhone, stops } = req.body;

  if (!busNumber || !from || !to) {
    return res.status(400).json({ error: 'Bus number, start station, and destination are required' });
  }

  const cleanBusNumber = String(busNumber).trim();
  const cleanFrom = String(from).trim();
  const cleanTo = String(to).trim();

  const newRoute = {
    id: `route-${cleanBusNumber.toLowerCase().replace(/[^a-z0-9]/g, '')}-${Date.now()}`,
    busNumber: cleanBusNumber,
    from: cleanFrom,
    to: cleanTo,
    busType: busType || 'Haryana Roadways Superfast / Express',
    operator: operator || 'Haryana Roadways',
    driverName: driverName ? String(driverName).trim() : '',
    driverPhone: driverPhone ? String(driverPhone).trim() : '',
    stops: formatStops(stops, cleanFrom, cleanTo),
    addedBy: 'passenger',
    updatedAt: new Date().toISOString()
  };

  routes.push(newRoute);
  writeRoutes(routes);

  // Notify all clients about the new route
  io.emit('routes-updated', { action: 'create', route: newRoute });

  res.status(201).json(newRoute);
});

// Update route/bus info (passengers can update driver, bus type, stops, etc.)
app.put('/api/routes/:id', (req, res) => {
  const routes = readRoutes();
  const index = routes.findIndex(r => r.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Route not found' });

  const current = routes[index];
  const { busNumber, from, to, busType, operator, driverName, driverPhone, stops } = req.body;

  const updated = {
    ...current,
    busNumber: busNumber !== undefined ? String(busNumber).trim() : current.busNumber,
    from: from !== undefined ? String(from).trim() : current.from,
    to: to !== undefined ? String(to).trim() : current.to,
    busType: busType !== undefined ? busType : current.busType,
    operator: operator !== undefined ? operator : (current.operator || 'Haryana Roadways'),
    driverName: driverName !== undefined ? String(driverName).trim() : current.driverName,
    driverPhone: driverPhone !== undefined ? String(driverPhone).trim() : current.driverPhone,
    stops: stops !== undefined ? formatStops(stops, from || current.from, to || current.to) : current.stops,
    id: current.id,
    updatedAt: new Date().toISOString()
  };

  routes[index] = updated;
  writeRoutes(routes);

  io.emit('routes-updated', { action: 'update', route: updated });
  res.json(updated);
});

// ── Socket.io Real-Time Engine ───────────────────────────────────

io.on('connection', (socket) => {
  console.log(`✅ Passenger connected: ${socket.id}`);

  // User joins a specific route channel
  socket.on('join-route', (routeId) => {
    // Leave previous route rooms
    Array.from(socket.rooms).forEach(room => {
      if (room !== socket.id) socket.leave(room);
    });

    if (routeId) {
      socket.join(routeId);
      console.log(`📍 ${socket.id} joined route: ${routeId}`);

      // Send current active buses on this route
      const busesOnRoute = Object.entries(activeBuses)
        .filter(([, b]) => b.routeId === routeId)
        .map(([busId, b]) => ({
          busId,
          lat: b.lat,
          lng: b.lng,
          speed: b.speed,
          accuracy: b.accuracy,
          routeId: b.routeId,
          timestamp: b.timestamp
        }));

      socket.emit('current-buses', busesOnRoute);
    } else {
      // Global room for all buses
      socket.join('all-routes');
      const allActive = Object.entries(activeBuses).map(([busId, b]) => ({
        busId,
        lat: b.lat,
        lng: b.lng,
        speed: b.speed,
        accuracy: b.accuracy,
        routeId: b.routeId,
        timestamp: b.timestamp
      }));
      socket.emit('current-buses', allActive);
    }
  });

  // Passenger shares live location
  socket.on('share-location', (data) => {
    const { busId, routeId, lat, lng, speed, accuracy } = data;
    if (!busId || !routeId || lat == null || lng == null) return;

    activeBuses[busId] = {
      busId,
      lat: Number(lat),
      lng: Number(lng),
      speed: speed != null ? Number(speed) : null,
      accuracy: accuracy != null ? Number(accuracy) : null,
      socketId: socket.id,
      routeId,
      timestamp: Date.now()
    };

    const payload = {
      busId,
      routeId,
      lat: Number(lat),
      lng: Number(lng),
      speed: speed != null ? Number(speed) : null,
      accuracy: accuracy != null ? Number(accuracy) : null,
      timestamp: Date.now()
    };

    // Broadcast to route room and all-routes listeners
    io.to(routeId).emit('location-update', payload);
    io.to('all-routes').emit('location-update', payload);
  });

  // Passenger stops sharing
  socket.on('stop-sharing', (busId) => {
    if (activeBuses[busId]) {
      const routeId = activeBuses[busId].routeId;
      delete activeBuses[busId];
      io.to(routeId).emit('bus-offline', { busId });
      io.to('all-routes').emit('bus-offline', { busId });
      console.log(`🔴 Bus ${busId} stopped sharing`);
    }
  });

  // Disconnect cleanup
  socket.on('disconnect', () => {
    Object.entries(activeBuses).forEach(([busId, data]) => {
      if (data.socketId === socket.id) {
        const routeId = data.routeId;
        delete activeBuses[busId];
        io.to(routeId).emit('bus-offline', { busId });
        io.to('all-routes').emit('bus-offline', { busId });
        console.log(`🔴 Bus ${busId} offline (disconnect)`);
      }
    });
    console.log(`❌ User disconnected: ${socket.id}`);
  });
});

// ── Start Server ─────────────────────────────────────────────────
server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚌 Bus Tracker running at http://localhost:${PORT}`);
  console.log(`📱 Access on your local network: http://<your-ip>:${PORT}\n`);
});
