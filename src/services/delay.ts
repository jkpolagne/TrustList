export function withDelay<T>(data: T): Promise<T> {
  const ms = 300 + Math.random() * 200;
  return new Promise((resolve) => setTimeout(() => resolve(data), ms));
}
