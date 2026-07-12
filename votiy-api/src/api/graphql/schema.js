import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildSchema, Kind, parse, validate } from 'graphql'

const directory = dirname(fileURLToPath(import.meta.url))
const contractPath = join(directory, '..', '..', '..', '..', 'specs', '003-entry-derived-participants', 'contracts', 'schema.graphql')

function configureDateTimeScalar(schema) {
  const scalar = schema.getType('DateTime')
  const parseDate = (value) => {
    const date = value instanceof Date ? value : new Date(value)
    if (Number.isNaN(date.getTime())) throw new TypeError('DateTime must be a valid UTC instant')
    return date
  }
  scalar.serialize = (value) => parseDate(value).toISOString()
  scalar.parseValue = parseDate
  scalar.parseLiteral = (node) => {
    if (node.kind !== Kind.STRING) throw new TypeError('DateTime must be a string')
    return parseDate(node.value)
  }
}

export async function createGraphqlSchema() {
  const source = await readFile(contractPath, 'utf8')
  const schema = buildSchema(source)
  configureDateTimeScalar(schema)
  return schema
}

export function validateGraphqlOperation(schema, source, { isProduction = false } = {}) {
  const document = parse(source)
  if (isProduction && document.definitions.some((definition) =>
    definition.selectionSet?.selections?.some((selection) => selection.name?.value.startsWith('__')))) {
    throw new Error('GraphQL introspection is disabled')
  }
  return { document, errors: validate(schema, document) }
}
