import type { TFunction } from 'i18next'

type LabelGroup = 'actions' | 'entities' | 'fields' | 'values'
type Fallback = 'unknownAction' | 'unknownEntity' | 'unknownField' | 'unknownValue'

export function auditLabel(t: TFunction, group: LabelGroup, code: string, fallback: Fallback = 'unknownValue') {
  return t(`audit.${group}.${code}` as 'audit.actions.LOGIN', { defaultValue: t(`audit.${fallback}`) })
}
