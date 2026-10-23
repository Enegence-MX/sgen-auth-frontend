import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, expect } from 'vitest'
import { contractViolations } from './fixtures'

afterEach(cleanup)
afterEach(() => {
  const violations = contractViolations.splice(0)
  expect(violations, 'fixture traffic must match contract/openapi.json').toEqual([])
})
