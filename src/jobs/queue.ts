export type JobStatus = "pending" | "processing" | "completed" | "failed";

export interface Job<T = unknown> {
  id: string;
  type: string;
  payload: T;
  status: JobStatus;
  attempts: number;
  maxAttempts: number;
  error?: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}

type Handler<T> = (payload: T) => Promise<void>;

export class JobQueue {
  private jobs = new Map<string, Job>();
  private handlers = new Map<string, Handler<unknown>>();
  private queue: string[] = [];
  private processing = false;

  register<T>(type: string, handler: Handler<T>): void {
    this.handlers.set(type, handler as Handler<unknown>);
  }

  async add<T>(type: string, payload: T, opts?: { maxAttempts?: number }): Promise<string> {
    const id = `job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const job: Job<T> = {
      id,
      type,
      payload,
      status: "pending",
      attempts: 0,
      maxAttempts: opts?.maxAttempts || 3,
      createdAt: new Date().toISOString(),
    };
    this.jobs.set(id, job as Job);
    this.queue.push(id);
    this.tick();
    return id;
  }

  get(id: string): Job | undefined {
    return this.jobs.get(id);
  }

  private async tick(): Promise<void> {
    if (this.processing) return;
    this.processing = true;
    while (this.queue.length > 0) {
      const id = this.queue.shift()!;
      const job = this.jobs.get(id);
      if (!job) continue;
      const handler = this.handlers.get(job.type);
      if (!handler) {
        job.status = "failed";
        job.error = `No handler for ${job.type}`;
        continue;
      }
      job.status = "processing";
      job.startedAt = new Date().toISOString();
      job.attempts++;
      try {
        await handler(job.payload);
        job.status = "completed";
        job.completedAt = new Date().toISOString();
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        job.error = msg;
        if (job.attempts < job.maxAttempts) {
          job.status = "pending";
          this.queue.push(id);
        } else {
          job.status = "failed";
          job.completedAt = new Date().toISOString();
        }
      }
    }
    this.processing = false;
  }
}

export const jobQueue = new JobQueue();
