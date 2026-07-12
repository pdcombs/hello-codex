export function readEntries(form, count) {
  return Array.from({ length: count }, (_, index) => ({
    title: String(form.get(`entry-title-${index}`) ?? '').trim(),
    categoryId: String(form.get(`entry-category-${index}`) ?? ''),
  }))
}
