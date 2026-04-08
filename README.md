# F3 Nation - PNPM Turbo Monorepo

This is a monorepo that is built with PNPM workspaces and Turbo for managing multiple applications and shared packages.

## Monorepo Fundamentals

### Working with the Root Directory

The root directory contains configuration files that govern the entire monorepo:

- `**package.json**`: Root-level dependencies and scripts
- `**pnpm-workspace.yaml**`: Defines workspace packages (apps and packages directories)
- `**turbo.json**`: Turbo configuration for task orchestration, caching, and pipeline definitions
- **Root-level commands** affect all workspaces unless filtered

### Working with Application Directories

Each application in the `apps/` directory is a self-contained project:

- **Individual `package.json`**: Application-specific dependencies and scripts
- **Independent development**: Can be run separately from other apps
- **Shared code access**: Can import from shared packages in the monorepo
- **Port configuration**: Each app typically runs on its own port

### Using Filter Flags with PNPM Commands

PNPM provides powerful filtering capabilities to target specific workspaces:

#### Installation Filtering

```bash
# Install dependencies for all workspaces
pnpm install

# Install dependencies for a specific app
pnpm install --filter f3-nation-map

# Install dependencies for multiple specific apps
pnpm install --filter f3-nation-map --filter another-app

# Install dependencies for all apps
pnpm install
```

#### Development Filtering

```bash
# Start development server for all apps
pnpm dev

# Start development server for specific app
pnpm dev --filter f3-nation-map

# Start development server with custom turbo flags
pnpm dev --filter f3-nation-map -- --port 3001
```

#### Build Filtering

```bash
# Build all workspaces
pnpm build

# Build specific app
pnpm build --filter f3-nation-map
```

#### Other Useful Filter Patterns

```bash
# Run tests for specific workspace
pnpm test --filter f3-nation-map

# Run linting for specific workspace
pnpm lint --filter f3-nation-map

```

### Turbo Configuration

The `turbo.json` file defines the build pipeline and task dependencies for the monorepo. It enables:

- **Task pipelines**: Define how tasks (dev, build, test, lint) depend on each other
- **Caching strategy**: Configure what files and outputs should be cached
- **Environment variables**: Specify which env vars affect task outputs for caching
- **Output logging**: Control what gets logged during task execution

### Turbo Cache Benefits

The monorepo leverages Turbo's caching system:

- **Incremental builds**: Only rebuild what changed
- **Remote caching**: Share cache across team members and CI
- **Parallel execution**: Run tasks concurrently when possible
- **Dependency graph**: Smart task ordering based on dependencies

## Setup

1. **Clone the repository**:
  ```bash
   git clone https://github.com/High-Country-Dev/f3-nation.git && cd f3-nation
  ```
2. **Install PNPM globally** (if not already installed):
  ```bash
   npm install -g pnpm
  ```
3. **Install dependencies**:
  ```bash
   pnpm install
  ```
4. **Environment setup**:
  - Get env.zip from F3 Nation Slack
  - Unzip and rename to `.env`
  - **Important**: Environment variables are application-specific. Place the `.env` file in the appropriate application directory, not the monorepo root
  - For local map and API development, place env files in `apps/map/.env` and `apps/api/.env`
  - Use these local HTTPS values in your env files:
    ```bash
    NEXT_PUBLIC_MAP_URL='https://map.f3nation.test'
    NEXT_PUBLIC_API_URL='https://api.f3nation.test'
    ```
  - See [F3 Nation Map README](apps/map/README.md) for app-specific setup details
  - For PaxMiner data admin tooling, see [Admin README](apps/admin/README.md)
5. **Configure local hosts**:
  ```bash
   # /etc/hosts
   127.0.0.1 map.f3nation.test api.f3nation.test
  ```
6. **Start the local HTTPS proxy**:
  ```bash
   brew install caddy
   caddy run --config Caddyfile
  ```
7. **Start the API and map in separate terminals**:
  ```bash
   # API
   PORT=3001 pnpm -F f3-nation-api dev

   # Map
   PORT=3000 pnpm -F f3-nation-map dev
  ```
8. **Verify the local setup**:
  ```text
   Map: https://map.f3nation.test
   API: https://api.f3nation.test
  ```

## Application Registry

### Current Applications


| Application          | Directory     | Port | Description                                                                                        |
| -------------------- | ------------- | ---- | -------------------------------------------------------------------------------------------------- |
| **F3 Nation Map**    | `apps/map/`   | 3000 | Interactive map application for F3 Nation locations and events - [README](apps/map/README.md)      |
| **Admin (PaxMiner)** | `apps/admin/` | -    | PaxMiner MySQL admin scripts for backups, migrations, and seeding - [README](apps/admin/README.md) |


### Future Applications (Planned)

*Additional applications will be added to this registry as they are developed*

## Package Registry

### Shared Packages


| Package        | Directory              | Description                                 |
| -------------- | ---------------------- | ------------------------------------------- |
| **API**        | `packages/api/`        | Backend API routes and ORPC routers         |
| **Auth**       | `packages/auth/`       | Authentication utilities and configurations |
| **DB**         | `packages/db/`         | Database client, schema, and migrations     |
| **Shared**     | `packages/shared/`     | Common utilities and shared logic           |
| **UI**         | `packages/ui/`         | Reusable UI components                      |
| **Validators** | `packages/validators/` | Data validation schemas                     |


## Environment Variables

Environment variables are application-specific in this monorepo. The `.env` file should be placed in the application directory (for example, `apps/map/.env` or `apps/api/.env`) rather than the monorepo root. For local HTTPS development with Caddy, use `NEXT_PUBLIC_MAP_URL='https://map.f3nation.test'` and `NEXT_PUBLIC_API_URL='https://api.f3nation.test'` in your local env files.

## Development Workflow

1. **Make changes** in the appropriate app or package directory
2. **Test locally** using filter flags to run only what you need
3. **Lint and test** before committing:
  ```bash
   pnpm lint --filter <your-workspace>
   pnpm test --filter <your-workspace>
  ```
4. **Commit changes** - Turbo will handle optimal task execution

# DB Commands

- Use ADMIN_BASE_DATABASE_URL from doppler if available
- For dev migrations use the `dev_generic` user
- For staging migrations use the `dev_generic` user
- For production migrations use the `f3slackbot` user

