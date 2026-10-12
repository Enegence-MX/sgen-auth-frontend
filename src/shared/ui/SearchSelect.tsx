import { useId, useMemo } from 'react'
import { Combobox } from '@base-ui/react/combobox'
import { Check, ChevronDown, Search, X } from 'lucide-react'
import { useOverlayContainer } from './use-overlay-container'
import { fieldLabelClassName } from './field-styles'

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

interface CommonProps {
  label: string
  options: readonly SelectOption[]
  name?: string
  disabled?: boolean
  labels: {
    placeholder: string
    empty: string
    toggle: string
    clear: string
    selected: string
    remove: (label: string) => string
  }
}

type SearchSelectProps = CommonProps & (
  { multiple?: false; value: string | null; onValueChange: (value: string | null) => void }
  | { multiple: true; value: string[]; onValueChange: (value: string[]) => void }
)

const actionClassName = 'inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-control border-0 bg-transparent text-body hover:bg-subtle disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-brand'

export function SearchSelect(props: Readonly<SearchSelectProps>) {
  const { label, options, labels, disabled, name } = props
  const id = useId()
  const container = useOverlayContainer()
  const items = useMemo(() => Combobox.createItems(options, { getValue: (item) => item.value, getLabel: (item) => item.label }), [options])
  const input = <Combobox.Input id={id} aria-label={label} placeholder={labels.placeholder} className={`m-0 flex-1 border-0 bg-transparent px-1 py-2 font-sans text-base leading-normal text-ink outline-none placeholder:text-muted ${props.multiple ? 'min-w-24 basis-24' : 'min-w-0'}`} />
  const content = (
    <div>
      <label htmlFor={id} className={fieldLabelClassName}>{label}</label>
      <Combobox.InputGroup className="flex min-h-12 items-center gap-1 rounded-control border border-solid border-line bg-field px-2 font-sans shadow-control transition-[border-color,box-shadow] hover:border-line-strong focus-within:border-brand focus-within:bg-panel focus-within:ring-3 focus-within:ring-brand/12 motion-reduce:transition-none forced-colors:focus-within:outline-2 data-disabled:bg-subtle data-disabled:opacity-60">
        {props.multiple ? (
          <Combobox.Chips aria-label={labels.selected} className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5 py-1">
            {props.value.map((value) => {
              const text = options.find((option) => option.value === value)?.label ?? value
              return <Combobox.Chip key={value} aria-label={text} className="inline-flex max-w-full items-center gap-1 rounded-lg border border-solid border-brand/15 bg-brand-soft py-1 pl-2 text-sm text-brand"><span className="truncate">{text}</span><Combobox.ChipRemove aria-label={labels.remove(text)} className="inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-control border-0 bg-transparent text-brand hover:bg-brand-soft focus-visible:outline-2 focus-visible:outline-brand"><X size={14} aria-hidden="true" /></Combobox.ChipRemove></Combobox.Chip>
            })}
            {input}
          </Combobox.Chips>
        ) : <><Search size={17} aria-hidden="true" className="ml-1 shrink-0 text-body" />{input}<Combobox.Clear aria-label={labels.clear} className={actionClassName}><X size={16} aria-hidden="true" /></Combobox.Clear></>}
        <Combobox.Trigger aria-label={labels.toggle} className={actionClassName}><ChevronDown size={17} aria-hidden="true" /></Combobox.Trigger>
      </Combobox.InputGroup>
      <Combobox.Portal container={container}>
        <Combobox.Positioner sideOffset={6} collisionPadding={12} className="z-70 w-(--anchor-width) max-w-[calc(100vw-24px)]">
          <Combobox.Popup className="max-h-[min(20rem,var(--available-height))] overflow-y-auto overscroll-contain rounded-card border border-solid border-line bg-panel font-sans text-body shadow-surface origin-(--transform-origin) transition-[opacity,transform] duration-150 data-starting:scale-95 data-starting:opacity-0 data-ending:scale-95 data-ending:opacity-0 motion-reduce:transition-none">
            <Combobox.Empty><p className="m-0 p-4 text-sm">{labels.empty}</p></Combobox.Empty>
            <Combobox.List className="p-2 empty:p-0">
              {(item: SelectOption) => <Combobox.Item key={item.value} value={item.value} disabled={item.disabled} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-control px-3 py-2 text-sm outline-none data-selected:bg-brand-soft/60 data-selected:font-semibold data-highlighted:bg-brand-soft data-highlighted:text-brand data-disabled:cursor-not-allowed data-disabled:opacity-40"><span className="min-w-0 flex-1">{item.label}</span><Combobox.ItemIndicator><Check size={17} aria-hidden="true" /></Combobox.ItemIndicator></Combobox.Item>}
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </div>
  )
  // Escape dismisses the popup without discarding selected values.
  if (props.multiple) return <Combobox.Root items={items} name={name} disabled={disabled} multiple value={props.value} onValueChange={(value, details) => {
    if (details.reason === 'escape-key') { details.cancel(); return }
    props.onValueChange(value)
  }}>{content}</Combobox.Root>
  return <Combobox.Root items={items} name={name} disabled={disabled} value={props.value} onValueChange={(value, details) => {
    if (details.reason === 'escape-key') { details.cancel(); return }
    props.onValueChange(value)
  }}>{content}</Combobox.Root>
}
