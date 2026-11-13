# Workers

Heavy jobs (web analysis, lead scoring, batch reports) will run as independent Node or Python processes.

Phase 0 only defines the `JobQueue` port under `infrastructure/queue`.

When Redis + BullMQ are introduced:

1. Implement a `BullMqJobQueue` adapter that satisfies `JobQueue`.
2. Swap the export in `infrastructure/queue/index.ts`.
3. Add worker entrypoints under this folder.
4. Keep Next.js responsible for enqueueing jobs and reading status — never run long batch work inside Route Handlers.
