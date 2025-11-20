export function createDebounce(func: () => Promise<void>, delay = 500) {
  const timeoutId = setTimeout(() => {
    void func();
  }, delay);

  return () => {
    clearTimeout(timeoutId);
  };
}
