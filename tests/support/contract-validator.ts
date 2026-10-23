import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { Ajv } from 'ajv'
import addFormats from 'ajv-formats'

interface Operation {
  responses?: Record<string, unknown>
  requestBody?: unknown
}
interface OpenApiDocument {
  paths: Record<string, Record<string, Operation>>
  components?: {
    schemas?: Record<string, unknown>
    responses?: Record<string, unknown>
  }
}

export const contract = JSON.parse(
  readFileSync(resolve(import.meta.dirname, '../../contract/openapi.json'), 'utf8'),
) as OpenApiDocument

// Every described object is closed, so fields from an older contract fail instead of passing silently.
function closed(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(closed)
  if (!node || typeof node !== 'object') return node
  const copy: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(node))
    copy[key] =
      key === '$ref' && typeof value === 'string'
        ? value.replace('#/components/schemas/', '')
        : closed(value)
  if (copy.properties && copy.additionalProperties === undefined) copy.additionalProperties = false
  return copy
}

const lastSegment = (ref: string) => ref.split('/').pop() ?? ref

function schemaRef(response: unknown): string | undefined {
  const content = (response as { content?: Record<string, { schema?: { $ref?: string } }> } | undefined)
    ?.content
  return content?.['application/json']?.schema?.$ref
}

export function createValidator(document: OpenApiDocument = contract) {
  const ajv = new Ajv({ allErrors: true, strict: true })
  addFormats(ajv)
  ajv.addKeyword('example')
  ajv.addFormat('password', true)
  for (const [name, schema] of Object.entries(document.components?.schemas ?? {}))
    ajv.addSchema(closed(schema) as object, name)
  const routes = Object.entries(document.paths).map(([path, item]) => ({
    item,
    segments: path.split('/'),
  }))
  const matches = (segments: string[], path: string) => {
    const actual = path.split('/')
    return (
      actual.length === segments.length &&
      segments.every((segment, index) => segment.startsWith('{') ? Boolean(actual[index]) : segment === actual[index])
    )
  }

  function errors(schema: string, body: unknown): string[] {
    const validate = ajv.getSchema(schema)
    if (!validate) throw new Error(`Unknown OpenAPI schema ${schema}`)
    return validate(body)
      ? []
      : (validate.errors ?? []).map(
          (error) => `${error.instancePath || '/'} ${error.message} ${JSON.stringify(error.params)}`,
        )
  }

  function operationFor(method: string, url: string) {
    const path = new URL(url, 'https://contract.test').pathname
    const route = routes.find(({ segments }) => matches(segments, path))
    return { path, operation: route?.item[method.toLowerCase()] }
  }

  function requestErrors(method: string, url: string, body: unknown): string[] {
    const { path, operation } = operationFor(method, url)
    if (!operation) return [`undocumented operation ${method} ${path}`]
    const ref = schemaRef(operation.requestBody)
    if (!ref) return body === undefined ? [] : [`${method} ${path} does not take a body`]
    return errors(lastSegment(ref), body).map((error) => `${method} ${path} request: ${error}`)
  }

  function responseErrors(method: string, url: string, status: number, body: unknown): string[] {
    const { path, operation } = operationFor(method, url)
    if (!operation) return [`undocumented operation ${method} ${path}`]
    let response = operation.responses?.[status]
    const shared = (response as { $ref?: string } | undefined)?.$ref
    if (shared) response = document.components?.responses?.[lastSegment(shared)]
    const ref = schemaRef(response)
    if (!ref) return [`undocumented status ${status} for ${method} ${path}`]
    return errors(lastSegment(ref), body).map((error) => `${method} ${path} ${status}: ${error}`)
  }

  return { errors, requestErrors, responseErrors }
}

export const validator = createValidator()

export const errorCodes = (contract.components?.schemas?.ErrorCode as { enum: string[] } | undefined)?.enum ?? []
