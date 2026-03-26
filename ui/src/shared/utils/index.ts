export function filterByKeyword<T extends { name?: string }>(items: T[], keyword: string) {
  const normalized = keyword.trim().toLowerCase()

  if (!normalized) {
    return items
  }

  return items.filter(item => item.name?.toLowerCase()?.includes(normalized))
}
