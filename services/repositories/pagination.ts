export const DEFAULT_PAGE_SIZE = 50;

export function isPageExhausted(count: number, pageSize: number = DEFAULT_PAGE_SIZE): boolean {
  return count < pageSize;
}


