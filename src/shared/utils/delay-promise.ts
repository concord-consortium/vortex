export function delayPromise<T>(delay: number, result?: T): Promise<T> {
  return new Promise<T>(resolve => setTimeout(() => resolve(result), delay));
}
