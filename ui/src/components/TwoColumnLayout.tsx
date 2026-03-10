import { Box } from '@mantine/core'

import type { ReactNode } from 'react'

export interface TwoColumnLayout24x76Props {
  left?: ReactNode
  leftAriaHidden?: boolean
  right: ReactNode
}

export function TwoColumnLayout24x76({
  left,
  leftAriaHidden = false,
  right,
}: TwoColumnLayout24x76Props) {
  return (
    <Box className="layout-24-76">
      <Box className="layout-24-76__left" aria-hidden={leftAriaHidden}>
        {left}
      </Box>
      <Box className="layout-24-76__right">
        {right}
      </Box>
    </Box>
  )
}
