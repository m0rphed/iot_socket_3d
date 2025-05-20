export interface SelectableObject {
  isSelected: boolean
  select(): void
  deselect(): void
} 