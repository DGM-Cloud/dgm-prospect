/**
 * Job queue port — prepare for Redis + BullMQ workers without requiring them in Phase 0.
 * Do not present a no-op as a real async infrastructure.
 */

export type JobStatus = "queued" | "active" | "completed" | "failed" | "delayed";

export type JobRecord<TPayload = unknown, TResult = unknown> = {
  id: string;
  name: string;
  payload: TPayload;
  status: JobStatus;
  result?: TResult;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type EnqueueOptions = {
  delayMs?: number;
  attempts?: number;
};

export interface JobQueue {
  enqueue<TPayload>(
    name: string,
    payload: TPayload,
    options?: EnqueueOptions,
  ): Promise<JobRecord<TPayload>>;
  getJob<TPayload = unknown, TResult = unknown>(
    id: string,
  ): Promise<JobRecord<TPayload, TResult> | null>;
}

export class JobQueueNotConfiguredError extends Error {
  constructor(message = "Job queue is not configured. Redis/BullMQ will be added when needed.") {
    super(message);
    this.name = "JobQueueNotConfiguredError";
  }
}
