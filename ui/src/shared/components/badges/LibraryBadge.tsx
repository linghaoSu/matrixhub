import PytorchIcon from '@/assets/svgs/pytorch.svg?react'
import { BaseBadge } from '@/shared/components/badges/BaseBadge'

import type { ComponentProps, ReactNode } from 'react'

type BaseBadgeProps = ComponentProps<typeof BaseBadge>

interface LibraryBadgeProps extends Omit<BaseBadgeProps, 'icon' | 'label'> {
  library: string
}

const LIBRARY_ICON_ENTRIES = [
  {
    matcher: /pytorch/i,
    icon: <PytorchIcon width={16} height={16} style={{ color: 'gray.6' }} />,
  },
] as const

function resolveLibraryIcon(library: string): ReactNode {
  const matched = LIBRARY_ICON_ENTRIES.find(item => item.matcher.test(library))

  return matched?.icon ?? null
}

export function LibraryBadge({
  library,
  ...badgeProps
}: LibraryBadgeProps) {
  return (
    <BaseBadge
      icon={resolveLibraryIcon(library)}
      label={library}
      {...badgeProps}
    />
  )
}
