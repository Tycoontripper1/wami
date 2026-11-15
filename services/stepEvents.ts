import type { StepNotice } from '@/utils/stepNotices';

/* A tiny channel between whatever notices a step change (the watcher) and the
   banner that shows it. Plain functions, no store: a notice is shown once and gone. */

type Listener = (notice: StepNotice) => void;
const listeners = new Set<Listener>();

export function onStepNotice(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function emitStepNotice(notice: StepNotice): void {
  listeners.forEach((listener) => listener(notice));
}
