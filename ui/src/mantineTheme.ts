import { createTheme, type MantineColorsTuple } from '@mantine/core'
// 21,170,191
// Primary brand color: rgb(21, 170, 191) = #15AABF
const brand: MantineColorsTuple = [
  '#e0fbff',
  '#b3f2fb',
  '#84e9f7',
  '#54e0f3',
  '#2ad7ef',
  '#15aabf',
  '#0d8a9c',
  '#066a79',
  '#004a56',
  '#002b33',
]

export const mantineTheme = createTheme({
  primaryColor: 'brand',
  colors: {
    brand,
  },
  primaryShade: 5,
})
