export function createAddSession(categories = [], keyFactory = defaultKeyFactory) {
  const defaultCategory = categories.find((category) => category.isDefault && !category.archivedAt)
  return {
    mode: 'choose',
    entryStep: 'category',
    categoryId: defaultCategory?.id ?? null,
    categoryTitle: '',
    owner: null,
    entryTitle: '',
    idempotencyKey: keyFactory(),
    saving: false,
    error: null,
    fieldErrors: {},
  }
}

export function addSessionReducer(state, action) {
  switch (action.type) {
    case 'choose':
      return { ...state, mode: action.mode, entryStep: 'category', error: null, fieldErrors: {} }
    case 'back':
      if (state.mode === 'entry' && state.entryStep === 'title') {
        return { ...state, entryStep: 'owner', error: null, fieldErrors: {} }
      }
      if (state.mode === 'entry' && state.entryStep === 'owner') {
        return { ...state, entryStep: 'category', error: null, fieldErrors: {} }
      }
      if (state.mode !== 'choose') {
        return { ...state, mode: 'choose', error: null, fieldErrors: {} }
      }
      return state
    case 'category-selected':
      return { ...state, categoryId: action.categoryId, entryStep: 'owner', error: null, fieldErrors: {} }
    case 'owner-selected':
      return { ...state, owner: action.owner, entryStep: 'title', error: null, fieldErrors: {} }
    case 'owner-clear':
      return { ...state, owner: null, entryStep: 'owner', error: null, fieldErrors: {} }
    case 'category-title':
      return { ...state, categoryTitle: action.value, fieldErrors: { ...state.fieldErrors, title: null } }
    case 'entry-title':
      return { ...state, entryTitle: action.value, fieldErrors: { ...state.fieldErrors, title: null } }
    case 'saving':
      return { ...state, saving: true, error: null, fieldErrors: {} }
    case 'failed':
      return {
        ...state,
        entryStep: action.entryStep ?? state.entryStep,
        saving: false,
        error: action.error,
        fieldErrors: action.fieldErrors ?? {},
      }
    default:
      return state
  }
}

export function resolveActiveCategories(categories = []) {
  return categories.filter((category) => !category.archivedAt)
}

function defaultKeyFactory() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-unified-add`
}
