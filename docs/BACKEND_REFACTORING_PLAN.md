# Backend Layered Architecture Migration Plan

## Executive Summary

This plan outlines the migration of the RentRedi backend from a monolithic `server.js` file to a **layered architecture** following industry-standard patterns (Controller-Service-Repository).

**Migration Approach**: Incremental, non-breaking, test-driven
**Estimated Time**: 2-4 hours
**Risk Level**: Low (can rollback at any step)

---

## Current State

### File Structure
```
backend/
├── server.js                       # 192 lines - ALL logic here
├── firebaseConfig.js
├── services/
│   ├── weatherService.js
│   └── weatherCircuitBreaker.js
├── middleware/
│   └── telemetry.js
├── __tests__/
└── package.json
```

### Current Issues
- ❌ All routes, validation, business logic, and data access in one file
- ❌ Difficult to test individual components
- ❌ Hard to reuse business logic
- ❌ Database access mixed with HTTP handling
- ❌ Violations of Single Responsibility Principle

---

## Target State

### File Structure
```
backend/
├── server.js                       # 15 lines - App initialization ONLY
├── app.js                          # 30 lines - Express setup + middleware
├── config/
│   ├── database.js                 # Firebase configuration
│   └── env.js                      # Environment variables
├── routes/
│   ├── index.js                    # Route aggregator
│   ├── user.routes.js              # User endpoints
│   └── health.routes.js            # Health/metrics endpoints
├── controllers/
│   ├── user.controller.js          # HTTP request/response handling
│   └── health.controller.js        # Health check logic
├── services/
│   ├── user.service.js             # User business logic
│   ├── weather.service.js          # Renamed from weatherService.js
│   └── weather.circuitBreaker.js   # Renamed for consistency
├── repositories/
│   └── user.repository.js          # Firebase data access
├── models/
│   └── user.model.js               # Zod schemas + data models
├── middleware/
│   ├── telemetry.middleware.js     # Renamed for consistency
│   ├── error.middleware.js         # Centralized error handling
│   └── validation.middleware.js    # Request validation
├── utils/
│   ├── asyncHandler.js             # Wrap async routes
│   └── logger.js                   # Structured logging
├── __tests__/
│   ├── unit/
│   │   ├── services/
│   │   └── repositories/
│   └── integration/
│       └── routes/
└── package.json
```

### Benefits
- ✅ Single Responsibility: Each file has one job
- ✅ Testability: Can test layers independently
- ✅ Reusability: Services can be used by multiple controllers
- ✅ Maintainability: Easy to find and fix bugs
- ✅ Scalability: Can add features without touching existing code
- ✅ Team Collaboration: Clear ownership boundaries

---

## Layer Responsibilities

### 1. Routes Layer
**Purpose**: Define HTTP endpoints and map to controllers

**Responsibilities**:
- Define HTTP methods and paths
- Attach middleware to routes
- No business logic

**Example**:
```javascript
// routes/user.routes.js
const router = require('express').Router();
const controller = require('../controllers/user.controller');
const { validateUser } = require('../middleware/validation.middleware');

router.get('/', controller.getAllUsers);
router.get('/:id', controller.getUserById);
router.post('/', validateUser, controller.createUser);
router.put('/:id', validateUser, controller.updateUser);
router.delete('/:id', controller.deleteUser);

module.exports = router;
```

### 2. Controllers Layer
**Purpose**: Handle HTTP requests/responses

**Responsibilities**:
- Parse request parameters
- Call service layer
- Format responses
- Handle HTTP status codes
- No business logic or database access

**Example**:
```javascript
// controllers/user.controller.js
const userService = require('../services/user.service');
const asyncHandler = require('../utils/asyncHandler');

exports.createUser = asyncHandler(async (req, res) => {
  const user = await userService.createUser(req.body);
  res.status(201).json(user);
});

exports.getAllUsers = asyncHandler(async (req, res) => {
  const users = await userService.getAllUsers();
  res.json(users);
});
```

### 3. Services Layer
**Purpose**: Business logic

**Responsibilities**:
- Implement business rules
- Coordinate between multiple repositories
- Call external services (weather API)
- Transform data
- No HTTP or database details

**Example**:
```javascript
// services/user.service.js
const userRepository = require('../repositories/user.repository');
const weatherService = require('./weather.service');
const { UserModel } = require('../models/user.model');

exports.createUser = async (userData) => {
  // Validate
  const validated = UserModel.parse(userData);

  // Get geolocation data
  const geoData = await weatherService.getLocationData(validated.zip);

  // Combine and save
  const userWithGeo = {
    ...validated,
    ...geoData
  };

  return userRepository.create(userWithGeo);
};
```

### 4. Repositories Layer
**Purpose**: Data access

**Responsibilities**:
- CRUD operations with Firebase
- Query construction
- Data persistence
- No business logic

**Example**:
```javascript
// repositories/user.repository.js
const { db, admin } = require('../config/database');

exports.create = async (userData) => {
  const newUserRef = db.ref('users').push();
  const userWithMeta = {
    ...userData,
    id: newUserRef.key,
    createdAt: admin.database.ServerValue.TIMESTAMP
  };
  await newUserRef.set(userWithMeta);
  return userWithMeta;
};

exports.findAll = async () => {
  const snapshot = await db.ref('users').once('value');
  return snapshot.val() || {};
};

exports.findById = async (id) => {
  const snapshot = await db.ref('users').child(id).once('value');
  return snapshot.val();
};
```

### 5. Models Layer
**Purpose**: Data schemas and validation

**Responsibilities**:
- Define data structure
- Validation rules
- Type definitions

**Example**:
```javascript
// models/user.model.js
const { z } = require('zod');

const UserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  zip: z.string().regex(/^\d{5}$/, 'Must be a 5-digit ZIP code')
});

const UserWithGeoSchema = UserSchema.extend({
  latitude: z.number(),
  longitude: z.number(),
  timezone: z.number(),
  locationName: z.string()
});

module.exports = {
  UserSchema,
  UserWithGeoSchema
};
```

---

## Migration Steps (Incremental)

### Phase 1: Setup Infrastructure (30 mins)

**Goal**: Create folder structure and utility files without breaking existing code

**Steps**:
1. Create new folders: `routes/`, `controllers/`, `services/`, `repositories/`, `models/`, `config/`, `utils/`
2. Create `utils/asyncHandler.js` for error handling
3. Create `config/env.js` for environment variables
4. Create `middleware/error.middleware.js` for centralized errors

**Validation**: Run `npm test` - all tests should still pass

---

### Phase 2: Extract Models (20 mins)

**Goal**: Move validation schemas to separate file

**Steps**:
1. Create `models/user.model.js`
2. Move `UserSchema` from `server.js` to `models/user.model.js`
3. Update `server.js` to import from models
4. Run tests

**Files to Create**:
- `models/user.model.js`

**Files to Modify**:
- `server.js` (import UserSchema from new location)

**Validation**: Run `npm test` - all tests should still pass

---

### Phase 3: Extract Repository Layer (30 mins)

**Goal**: Separate database access from route handlers

**Steps**:
1. Create `repositories/user.repository.js`
2. Move all `db.ref()` calls from `server.js` to repository
3. Create methods: `create()`, `findAll()`, `findById()`, `update()`, `delete()`
4. Update `server.js` to call repository methods
5. Rename `firebaseConfig.js` to `config/database.js`
6. Run tests

**Files to Create**:
- `repositories/user.repository.js`

**Files to Modify**:
- `server.js` (use repository instead of direct db calls)
- `firebaseConfig.js` → `config/database.js`

**Validation**: Run `npm test` - all tests should still pass

---

### Phase 4: Extract Service Layer (30 mins)

**Goal**: Move business logic out of routes

**Steps**:
1. Create `services/user.service.js`
2. Move business logic (validation + geo lookup + data combination)
3. Service calls repository and weather service
4. Update `server.js` to call service methods
5. Run tests

**Files to Create**:
- `services/user.service.js`

**Files to Modify**:
- `server.js` (use service instead of inline logic)

**Validation**: Run `npm test` - all tests should still pass

---

### Phase 5: Extract Controllers (30 mins)

**Goal**: Separate HTTP handling from routing

**Steps**:
1. Create `controllers/user.controller.js`
2. Create `controllers/health.controller.js`
3. Move all `async (req, res) => {}` functions to controllers
4. Controllers call services and format responses
5. Update `server.js` to use controllers
6. Run tests

**Files to Create**:
- `controllers/user.controller.js`
- `controllers/health.controller.js`

**Files to Modify**:
- `server.js` (use controllers)

**Validation**: Run `npm test` - all tests should still pass

---

### Phase 6: Extract Routes (30 mins)

**Goal**: Move route definitions to separate files

**Steps**:
1. Create `routes/user.routes.js`
2. Create `routes/health.routes.js`
3. Create `routes/index.js` (aggregator)
4. Move route definitions from `server.js` to route files
5. Update `server.js` to use route aggregator
6. Run tests

**Files to Create**:
- `routes/user.routes.js`
- `routes/health.routes.js`
- `routes/index.js`

**Files to Modify**:
- `server.js` (mount routes from aggregator)

**Validation**: Run `npm test` - all tests should still pass

---

### Phase 7: Extract App Configuration (20 mins)

**Goal**: Separate Express setup from server startup

**Steps**:
1. Create `app.js` with Express configuration
2. Move middleware setup to `app.js`
3. `server.js` becomes minimal (just listens)
4. Run tests

**Files to Create**:
- `app.js`

**Files to Modify**:
- `server.js` (minimal, just app.listen)

**Final `server.js`**:
```javascript
const app = require('./app');
const PORT = process.env.PORT || 8080;
const HOST = '0.0.0.0';

if (require.main === module) {
  app.listen(PORT, HOST, () => {
    console.log(`Server running on http://${HOST}:${PORT}`);
  });
}

module.exports = app;
```

**Validation**: Run `npm test` - all tests should still pass

---

### Phase 8: Update Tests (30 mins)

**Goal**: Update tests to work with new structure

**Steps**:
1. Update imports in test files
2. Add unit tests for services
3. Add unit tests for repositories
4. Keep integration tests for routes
5. Run full test suite

**Validation**: All tests pass with better coverage

---

## File Mapping Reference

| Current Location | New Location | What Moves |
|-----------------|--------------|------------|
| `server.js` lines 34-36 | `models/user.model.js` | UserSchema |
| `server.js` lines 89-93 | `repositories/user.repository.js` | findAll() |
| `server.js` lines 97-102 | `repositories/user.repository.js` | findById() |
| `server.js` lines 106-134 | `services/user.service.js` → `controllers/user.controller.js` | Create logic |
| `server.js` lines 138-173 | `services/user.service.js` → `controllers/user.controller.js` | Update logic |
| `server.js` lines 177-179 | `repositories/user.repository.js` | delete() |
| `server.js` lines 51-83 | `controllers/health.controller.js` | Health check |
| `firebaseConfig.js` | `config/database.js` | Firebase config |

---

## Testing Strategy

### During Migration
After each phase:
```bash
npm run test:mock    # Unit tests should pass
npm run lint         # No linting errors
npm start            # Server should start
curl http://localhost:8080/health  # Health check works
```

### After Migration
```bash
# Unit tests for each layer
npm run test:services
npm run test:repositories
npm run test:controllers

# Integration tests
npm run test:integration

# Full suite
npm test
```

---

## Rollback Plan

Each phase is incremental and non-breaking:

1. **Phase 1-7**: If issues arise, simply revert the last commit
2. **Git strategy**: Commit after each phase with clear message
3. **Backup**: Create branch `backup/monolith-server` before starting
4. **Validation**: Tests pass after every phase

---

## Post-Migration Benefits

### Before (Current)
```javascript
// server.js - 192 lines
// Everything in one file: routes, validation, business logic, data access
```

### After (Layered)
```javascript
// server.js - 15 lines (just app.listen)
// app.js - 30 lines (Express setup)
// routes/user.routes.js - 15 lines (route definitions)
// controllers/user.controller.js - 40 lines (HTTP handling)
// services/user.service.js - 60 lines (business logic)
// repositories/user.repository.js - 50 lines (data access)
// models/user.model.js - 20 lines (schemas)
```

**Result**:
- ✅ Each file < 100 lines
- ✅ Easy to understand
- ✅ Easy to test
- ✅ Easy to modify
- ✅ Industry standard pattern

---

## Next Steps

1. **Review this plan** with team
2. **Create feature branch**: `git checkout -b refactor/layered-architecture`
3. **Follow migration phases** one at a time
4. **Commit after each phase** with descriptive message
5. **Run tests** after every change
6. **Create PR** when complete for review

---

## Questions to Consider

Before starting:
- [ ] Do we have good test coverage to ensure nothing breaks?
- [ ] Should we add more tests before refactoring?
- [ ] Do we want to do this in one PR or multiple?
- [ ] Should we pair program during migration?

---

## Timeline

| Phase | Time | Cumulative |
|-------|------|-----------|
| 1. Infrastructure | 30 min | 30 min |
| 2. Models | 20 min | 50 min |
| 3. Repository | 30 min | 1h 20min |
| 4. Service | 30 min | 1h 50min |
| 5. Controllers | 30 min | 2h 20min |
| 6. Routes | 30 min | 2h 50min |
| 7. App Config | 20 min | 3h 10min |
| 8. Tests | 30 min | 3h 40min |
| **Total** | | **~4 hours** |

---

## Success Criteria

Migration is complete when:
- ✅ All tests pass
- ✅ No linting errors
- ✅ Server starts without errors
- ✅ All endpoints work as before
- ✅ Code coverage maintained or improved
- ✅ Each file follows Single Responsibility
- ✅ Clear separation between layers
- ✅ Documentation updated

---

**Ready to start? Let me know and I'll begin the migration!**
