import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildSchema, Kind, parse, validate } from 'graphql'

const directory = dirname(fileURLToPath(import.meta.url))
const contractPath = join(directory, '..', '..', '..', '..', 'specs', '003-entry-derived-participants', 'contracts', 'schema.graphql')
const votingContractPath = join(directory, '..', '..', '..', '..', 'specs', '007-event-voting-rules', 'contracts', 'schema-extension.graphql')
const workspaceContractPath = join(directory, '..', '..', '..', '..', 'specs', '008-event-details-navigation', 'contracts', 'schema-extension.graphql')
const searchContractPath = join(directory, '..', '..', '..', '..', 'specs', '010-find-events-search', 'contracts', 'schema-extension.graphql')
const detailsContractPath = join(directory, '..', '..', '..', '..', 'specs', '011-edit-event-voting-summary', 'contracts', 'schema-extension.graphql')
const passwordResetContractPath = join(directory, '..', '..', '..', '..', 'specs', '012-password-reset', 'contracts', 'schema-extension.graphql')
const votingStateContractPath = join(directory, '..', '..', '..', '..', 'specs', '013-open-close-voting', 'contracts', 'schema-extension.graphql')
const ballotContractPath = join(directory, '..', '..', '..', '..', 'specs', '014-event-ballot', 'contracts', 'schema-extension.graphql')
const ballotHistoryContractPath = join(directory, '..', '..', '..', '..', 'specs', '016-previous-vote-history', 'contracts', 'schema-extension.graphql')
const votingResultsContractPath = join(directory, '..', '..', '..', '..', 'specs', '018-review-voting-results', 'contracts', 'schema-extension.graphql')

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
  const [source, votingSource, workspaceSource, searchSource, detailsSource, passwordResetSource, votingStateSource,
    ballotSource, ballotHistorySource, votingResultsSource] = await Promise.all([
    readFile(contractPath, 'utf8'),
    readFile(votingContractPath, 'utf8'),
    readFile(workspaceContractPath, 'utf8'),
    readFile(searchContractPath, 'utf8'),
    readFile(detailsContractPath, 'utf8'),
    readFile(passwordResetContractPath, 'utf8'),
    readFile(votingStateContractPath, 'utf8'),
    readFile(ballotContractPath, 'utf8'),
    readFile(ballotHistoryContractPath, 'utf8'),
    readFile(votingResultsContractPath, 'utf8'),
  ])
  const schema = buildSchema(`${source}\n${votingSource}\n${workspaceSource}\n${searchSource}\n${detailsSource}\n${passwordResetSource}\n${votingStateSource}\n${ballotSource}\n${ballotHistorySource}\n${votingResultsSource}`)
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
