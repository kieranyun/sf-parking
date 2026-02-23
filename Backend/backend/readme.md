This is going to be a project where I make an app that gets data from a server that tracks where you park.

There will be an API that gets a location and returns any parking restrictions. The API gets data from SF street sweeping data: https://data.sfgov.org/City-Infrastructure/Street-Sweeping-Schedule/yhqp-riqs/about_data

start db with `docker-compose --env-file .env.docker up -d`



# SF-Parking-App


sf-parking-skeleton/
├── src/
│   ├── server.ts              # Main entry point (wire everything together)
│   ├── db/
│   │   ├── connection.ts      # Step 1: Database pool
│   │   ├── migrations.ts      # Step 2: Create tables
│   │   └── dataLoader.ts      # Step 3: Load SF data
│   ├── routes/
│   │   ├── health.ts          # Step 5: Health check
│   │   └── parking.ts         # Step 6: API endpoints
│   ├── services/
│   │   └── parkingService.ts  # Step 4: PostGIS queries
│   └── types/
│       └── index.ts           # TypeScript definitions
├── README.md                  # Full learning guide
├── CHEATSHEET.md              # Quick reference
└── docker-compose.yml         # PostgreSQL setup





# SF Parking App - Learning Project

A San Francisco parking restrictions API built with TypeScript, Express, and PostgreSQL/PostGIS.

## 🎯 Learning Goals

This skeleton will help you learn:
- TypeScript with Node.js
- Express routing and middleware
- PostgreSQL with PostGIS for geospatial queries
- REST API design
- Database migrations
- Error handling
- Environment configuration

## 📁 Project Structure

```
sf-parking-app/
├── src/
│   ├── server.ts              # Main entry point
│   ├── db/
│   │   ├── connection.ts      # Database connection pool
│   │   ├── migrations.ts      # Schema initialization
│   │   └── dataLoader.ts      # Load SF Open Data
│   ├── routes/
│   │   ├── health.ts          # Health check endpoint
│   │   └── parking.ts         # Parking API endpoints
│   ├── services/
│   │   └── parkingService.ts  # Business logic
│   └── types/
│       └── index.ts           # TypeScript type definitions
├── package.json
├── tsconfig.json
├── docker-compose.yml         # PostgreSQL setup
└── .env.example
```

## 🚀 Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Database

```bash
# Copy environment variables
cp .env.example .env

# Start PostgreSQL with Docker
docker-compose up -d

# Verify it's running
docker ps
```

### 3. Run the App

```bash
npm run dev
```

## 📚 Implementation Guide

Work through these steps in order:

### Step 1: Database Connection (src/db/connection.ts)
**Learn:** PostgreSQL connection pooling

**Tasks:**
- [ ] Configure the Pool with environment variables
- [ ] Implement `testConnection()` function
- [ ] Implement `closeConnection()` function
- [ ] Test connection with `psql` or a database client

**Resources:**
- [node-postgres documentation](https://node-postgres.com/)
- Pool configuration options

### Step 2: Database Schema (src/db/migrations.ts)
**Learn:** PostGIS, spatial indexes

**Tasks:**
- [ ] Enable PostGIS extension
- [ ] Create `street_sweeping` table with geometry column
- [ ] Create GIST spatial index
- [ ] Create `metadata` table
- [ ] Implement `needsInitialization()` check

**SQL you'll use:**
```sql
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE TABLE street_sweeping (
  id SERIAL PRIMARY KEY,
  geom GEOMETRY(LineString, 4326),
  ...
);
CREATE INDEX idx_geom ON street_sweeping USING GIST (geom);
```

**Resources:**
- [PostGIS documentation](https://postgis.net/)
- Understanding SRID 4326 (WGS84)

### Step 3: Data Loading (src/db/dataLoader.ts)
**Learn:** API calls, GeoJSON, database transactions

**Tasks:**
- [ ] Fetch data from SF Open Data API
- [ ] Convert GeoJSON coordinates to WKT format
- [ ] Insert data using transactions
- [ ] Handle errors and rollback

**Example WKT conversion:**
```
[[lon1, lat1], [lon2, lat2]] → "LINESTRING(lon1 lat1, lon2 lat2)"
```

**Resources:**
- [SF Open Data API](https://data.sfgov.org/resource/yhqp-riqs.geojson)
- GeoJSON format
- Well-Known Text (WKT)

### Step 4: Query Service (src/services/parkingService.ts)
**Learn:** PostGIS spatial queries

**Tasks:**
- [ ] Write query using `ST_DWithin` to find nearby streets
- [ ] Calculate distance with `ST_Distance`
- [ ] Map database rows to TypeScript objects
- [ ] Format schedule strings

**PostGIS query example:**
```sql
SELECT * FROM street_sweeping
WHERE ST_DWithin(
  geom::geography,
  ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
  $3
)
```

**Resources:**
- PostGIS spatial functions
- Geography vs Geometry types

### Step 5: Health Route (src/routes/health.ts)
**Learn:** Express routing, async handlers

**Tasks:**
- [ ] Query database for record count
- [ ] Return JSON response
- [ ] Handle database errors

### Step 6: Parking Routes (src/routes/parking.ts)
**Learn:** Request validation, error handling

**Tasks:**
- [ ] Validate latitude/longitude input
- [ ] Check SF boundary constraints
- [ ] Call parking service
- [ ] Return formatted response
- [ ] Implement reload-data endpoint

### Step 7: Wire It All Together (src/server.ts)
**Learn:** Application initialization

**Tasks:**
- [ ] Connect to database on startup
- [ ] Run migrations if needed
- [ ] Load data if database is empty
- [ ] Start Express server

## 🧪 Testing Your Work

Test each part as you build:

```bash
# Test database connection
curl http://localhost:3000/health

# Test parking check
curl -X POST http://localhost:3000/api/check-parking \
  -H 'Content-Type: application/json' \
  -d '{"latitude": 37.7749, "longitude": -122.4194}'

# Expected response:
{
  "latitude": 37.7749,
  "longitude": -122.4194,
  "restrictions": [...],
  "parkingAllowed": true/false
}
```

## 🐛 Common Issues & Solutions

**Database connection refused:**
- Check Docker is running: `docker ps`
- Verify .env settings match docker-compose.yml

**PostGIS extension not found:**
```bash
docker exec -it sf_parking_db psql -U postgres -d sf_parking
CREATE EXTENSION postgis;
```

**TypeScript errors:**
- Make sure to define types in `src/types/index.ts`
- Use `any` temporarily if stuck, then come back to type it properly

## 📖 Key Concepts to Understand

### PostGIS Geography vs Geometry
- **Geography**: Uses meters, accounts for Earth's curvature (use for distances)
- **Geometry**: Uses degrees, faster but less accurate over large areas

### Spatial Indexes (GIST)
- Without index: O(n) - checks every street
- With GIST index: O(log n) - uses R-tree structure
- Essential for performance!

### WGS84 / SRID 4326
- Standard coordinate system for GPS
- Longitude first, then latitude in PostGIS!

### Connection Pooling
- Reuses database connections
- Prevents overwhelming the database
- Automatically handles concurrent requests

## 🎓 Next Steps After Completion

1. Add more data sources (parking meters, permits)
2. Add time-based validation (is restriction active now?)
3. Add caching with Redis
4. Add tests with Jest
5. Add rate limiting
6. Deploy to production

## 📚 Resources

- [PostgreSQL Tutorial](https://www.postgresql.org/docs/current/tutorial.html)
- [PostGIS Introduction](https://postgis.net/workshops/postgis-intro/)
- [Express TypeScript Guide](https://expressjs.com/en/guide/routing.html)
- [SF Open Data Portal](https://data.sfgov.org/)

## 💡 Tips

- Use `console.log()` liberally while debugging
- Test SQL queries directly in `psql` before adding to code
- Commit after completing each step
- Don't try to do everything at once!

Good luck! 🚀