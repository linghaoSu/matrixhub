import {
  Badge,
  Group,
  Text,
  type BadgeProps,
} from '@mantine/core'

import type { ReactNode } from 'react'

interface BaseBadgeProps extends Omit<BadgeProps, 'children'> {
  icon?: ReactNode
  label?: ReactNode
  children?: ReactNode
}

type BadgeStylesObject = Exclude<NonNullable<BadgeProps['styles']>, (...args: never[]) => unknown>

const DEFAULT_BADGE_STYLES: BadgeStylesObject = {
  root: {
    backgroundColor: 'var(--mantine-color-gray-1)',
    paddingInline: 12,
    border: '1px solid var(--mantine-color-gray-1)',
  },
  label: {
    paddingInline: 0,
    textTransform: 'none',
  },
}

export function BaseBadge({
  icon,
  label,
  children,
  styles,
  ...badgeProps
}: BaseBadgeProps) {
  const objectStyles: BadgeStylesObject | undefined = styles && typeof styles !== 'function'
    ? styles
    : undefined

  const resolvedStyles = typeof styles === 'function'
    ? styles
    : {
        ...objectStyles,
        root: {
          ...DEFAULT_BADGE_STYLES.root,
          ...objectStyles?.root,
        },
        label: {
          ...DEFAULT_BADGE_STYLES.label,
          ...objectStyles?.label,
        },
      }

  return (
    <Badge
      h={24}
      radius="lg"
      styles={resolvedStyles}
      {...badgeProps}
    >
      <Group gap={4} wrap="nowrap" miw={0}>
        {icon
          ? (
              <span style={{
                display: 'flex',
                flexShrink: 0,
              }}
              >
                {icon}
              </span>
            )
          : null}
        {children ?? (
          <Text
            component="span"
            size="12px"
            lh="22px"
            fw={600}
            c="gray.6"
            truncate="end"
            miw={0}
          >
            {label}
          </Text>
        )}
      </Group>
    </Badge>
  )
}
