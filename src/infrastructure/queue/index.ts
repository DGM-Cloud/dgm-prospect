import {
  JobQueue,
  JobQueueNotConfiguredError,
  type EnqueueOptions,
  type JobRecord,
} from "./types";

/**
 * Explicit unconfigured queue. Callers must handle JobQueueNotConfiguredError.
 * Replace with BullMQ adapter when Redis is introduced — no business rewrite required.
 */
export class UnconfiguredJobQueue implements JobQueue {
  async enqueue<TPayload>(
    name: string,
    payload: TPayload,
    options?: EnqueueOptions,
  ): Promise<JobRecord<TPayload>> {
    void name;
    void payload;
    void options;
    throw new JobQueueNotConfiguredError();
  }

  async getJob<TPayload = unknown, TResult = unknown>(
    id: string,
  ): Promise<JobRecord<TPayload, TResult> | null> {
    void id;
    throw new JobQueueNotConfiguredError();
  }
}

export const jobQueue: JobQueue = new UnconfiguredJobQueue();

export * from "./types";
