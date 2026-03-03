# Figma → Mantine Component Mapping

This mapping table defines how Figma design tokens translate to Mantine v8 props. Update this file when the project theme changes.

## Spacing

| Figma value | Mantine token | px |
|---|---|---|
| 2px | 2 | 2 |
| 4px | `xs` | 4 |
| 8px | `sm` | 8 |
| 16px | `md` | 16 |
| 24px | `lg` | 24 |
| 32px | `xl` | 32 |
| 48px | 48 | 48 |

Usage: `<Stack gap="md">` = 16px gap.

## Typography

| Figma style | Mantine component |
|---|---|
| Heading / H1 | `<Title order={1}>` |
| Heading / H2 | `<Title order={2}>` |
| Heading / H3 | `<Title order={3}>` |
| Heading / H4 | `<Title order={4}>` |
| Body / Regular | `<Text>` |
| Body / Small | `<Text size="sm">` |
| Body / XS | `<Text size="xs">` |
| Body / Bold | `<Text fw={600}>` |
| Caption | `<Text size="xs" c="dimmed">` |
| Label | `<Text size="sm" fw={500}>` |

## Colors

> **TODO**: Update this section with your project's actual Mantine theme colors after configuring the theme.

| Figma token | Mantine value | Usage |
|---|---|---|
| Brand / Primary | `blue.6` | Primary actions, links |
| Brand / Primary Light | `blue.0` | Hover backgrounds |
| Neutral / Text | (default) | Body text |
| Neutral / Secondary | `dimmed` | Secondary text, captions |
| Neutral / Border | `gray.3` | Borders, dividers |
| Neutral / Background | `gray.0` | Section backgrounds |
| Neutral / Surface | `white` | Card backgrounds |
| Semantic / Error | `red.6` | Error states |
| Semantic / Success | `green.6` | Success states |
| Semantic / Warning | `yellow.6` | Warning states |

## Components

| Figma component | Mantine code |
|---|---|
| Primary Button | `<Button variant="filled">` |
| Secondary Button | `<Button variant="light">` |
| Outline Button | `<Button variant="outline">` |
| Ghost Button | `<Button variant="subtle">` |
| Text Input | `<TextInput>` |
| Text Area | `<Textarea>` |
| Select / Dropdown | `<Select>` |
| Checkbox | `<Checkbox>` |
| Switch / Toggle | `<Switch>` |
| Card | `<Paper shadow="sm" p="md" radius="md">` |
| Divider | `<Divider>` |
| Badge | `<Badge>` |
| Avatar | `<Avatar>` |
| Tooltip | `<Tooltip>` |
| Modal / Dialog | `<Modal>` |
| Drawer | `<Drawer>` |
| Table | `<Table>` |
| Tabs | `<Tabs>` |
| Breadcrumb | `<Breadcrumbs>` |
| Pagination | `<Pagination>` |
| Alert / Banner | `<Alert>` |
| Loading Spinner | `<Loader>` |
| Skeleton | `<Skeleton>` |

## Layout patterns

| Figma layout | Mantine code |
|---|---|
| Vertical stack | `<Stack gap="md">` |
| Horizontal row | `<Group gap="sm">` |
| Space between row | `<Group justify="space-between">` |
| Right-aligned items | `<Group justify="flex-end">` |
| Centered content | `<Center>` |
| Max-width container | `<Container size="lg">` |
| Grid (equal columns) | `<SimpleGrid cols={3}>` |
| Grid (custom columns) | `<Grid><Grid.Col span={8}>...</Grid.Col></Grid>` |
| Scrollable area | `<ScrollArea>` |

## Icon mapping

> **TODO**: Define your icon library mapping here (e.g., Tabler Icons).

| Figma icon | Code |
|---|---|
| Plus / Add | `<IconPlus size={16} />` |
| Search | `<IconSearch size={16} />` |
| Edit / Pencil | `<IconEdit size={16} />` |
| Delete / Trash | `<IconTrash size={16} />` |
| Close / X | `<IconX size={16} />` |
| Chevron Right | `<IconChevronRight size={16} />` |
| Settings / Gear | `<IconSettings size={16} />` |
