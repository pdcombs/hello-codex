export function unifiedAddKeys(prefix = 'unified-add') {
  return {
    category: `${prefix}-category-key`,
    entry: `${prefix}-entry-key`,
  }
}

export const unifiedAddActors = Object.freeze({
  ownerId: 'unified-add-owner',
  nonOwnerId: 'unified-add-non-owner',
})

