import {
  Alert,
  Badge,
  Button,
  Group,
  LoadingOverlay,
  Modal,
  Pagination,
  Paper,
  Select,
  Stack,
  Switch,
  Table,
  Text,
  TextInput,
  Title,
} from '@mantine/core'
import { useDebouncedValue } from '@mantine/hooks'
import {
  ProjectType,
  Projects,
  type Project,
} from '@matrixhub/api-ts/v1alpha1/project.pb'
import { Registries, type Registry } from '@matrixhub/api-ts/v1alpha1/registry.pb'
import { createFileRoute, Link } from '@tanstack/react-router'
import {
  useEffect,
  useMemo,
  useReducer,
  useState,
} from 'react'

const PAGE_SIZE_OPTIONS = [
  {
    value: '10',
    label: '10 / 页',
  },
  {
    value: '20',
    label: '20 / 页',
  },
  {
    value: '50',
    label: '50 / 页',
  },
]

const DEFAULT_PAGE_SIZE = 10
const NAME_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])$/

interface CreateFormErrors {
  name?: string
  registryId?: string
  organization?: string
  submit?: string
}

interface ProjectsState {
  items: Project[]
  total: number
  pages: number
  loading: boolean
  error: string | null
}

interface RegistriesState {
  items: Registry[]
  loading: boolean
  loaded: boolean
  error: string | null
}

type ProjectsAction
  = | {
    type: 'requestStarted'
  }
  | {
    type: 'requestSucceeded'
    items: Project[]
    total: number
    pages: number
  }
  | {
    type: 'requestFailed'
    error: string
  }

type RegistriesAction
  = | {
    type: 'requestStarted'
  }
  | {
    type: 'requestSucceeded'
    items: Registry[]
  }
  | {
    type: 'requestFailed'
    error: string
  }

const initialProjectsState: ProjectsState = {
  items: [],
  total: 0,
  pages: 0,
  loading: true,
  error: null,
}

const initialRegistriesState: RegistriesState = {
  items: [],
  loading: false,
  loaded: false,
  error: null,
}

export const Route = createFileRoute('/(auth)/(app)/projects/')({
  component: RouteComponent,
  staticData: {
    navName: 'Projects',
  },
})

function RouteComponent() {
  const [searchValue, setSearchValue] = useState('')
  const [debouncedSearchValue] = useDebouncedValue(searchValue, 300)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [refreshToken, setRefreshToken] = useState(0)

  const [projectsState, dispatchProjects] = useReducer(
    projectsReducer,
    initialProjectsState,
  )

  const [createOpened, setCreateOpened] = useState(false)
  const [createName, setCreateName] = useState('')
  const [createIsPublic, setCreateIsPublic] = useState(false)
  const [createUseRegistry, setCreateUseRegistry] = useState(false)
  const [createRegistryId, setCreateRegistryId] = useState<string | null>(null)
  const [createOrganization, setCreateOrganization] = useState('')
  const [createErrors, setCreateErrors] = useState<CreateFormErrors>({})
  const [createSubmitting, setCreateSubmitting] = useState(false)

  const [registriesState, dispatchRegistries] = useReducer(
    registriesReducer,
    initialRegistriesState,
  )

  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [deleteSubmitting, setDeleteSubmitting] = useState(false)

  const registryOptions = useMemo(
    () =>
      registriesState.items
        .filter(registry => registry.id !== undefined)
        .map(registry => ({
          value: String(registry.id),
          label: registry.name
            ? `${registry.name} (${registry.url ?? '未配置地址'})`
            : registry.url ?? `Registry #${registry.id}`,
        })),
    [registriesState.items],
  )

  useEffect(() => {
    const controller = new AbortController()

    dispatchProjects({
      type: 'requestStarted',
    })

    Projects.ListProjects(
      {
        name: debouncedSearchValue.trim() || undefined,
        page,
        pageSize,
      },
      {
        signal: controller.signal,
      },
    )
      .then((response) => {
        if (controller.signal.aborted) {
          return
        }

        dispatchProjects({
          type: 'requestSucceeded',
          items: response.projects ?? [],
          total: response.pagination?.total ?? response.projects?.length ?? 0,
          pages: response.pagination?.pages ?? 0,
        })
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return
        }

        dispatchProjects({
          type: 'requestFailed',
          error: getErrorMessage(error, '项目列表加载失败'),
        })
      })

    return () => {
      controller.abort()
    }
  }, [debouncedSearchValue, page, pageSize, refreshToken])

  useEffect(() => {
    if (
      !createOpened
      || !createUseRegistry
      || registriesState.loaded
      || registriesState.loading
    ) {
      return
    }

    const controller = new AbortController()

    dispatchRegistries({
      type: 'requestStarted',
    })

    Registries.ListRegistries(
      {
        page: 1,
        pageSize: 100,
      },
      {
        signal: controller.signal,
      },
    )
      .then((response) => {
        if (controller.signal.aborted) {
          return
        }

        dispatchRegistries({
          type: 'requestSucceeded',
          items: response.registries ?? [],
        })
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return
        }

        dispatchRegistries({
          type: 'requestFailed',
          error: getErrorMessage(error, '代理仓库加载失败'),
        })
      })

    return () => {
      controller.abort()
    }
  }, [
    createOpened,
    createUseRegistry,
    registriesState.loaded,
    registriesState.loading,
  ])

  const hasProjects = projectsState.items.length > 0
  const totalPages = projectsState.pages > 0
    ? projectsState.pages
    : hasProjects
      ? 1
      : 0

  function resetCreateForm() {
    setCreateName('')
    setCreateIsPublic(false)
    setCreateUseRegistry(false)
    setCreateRegistryId(null)
    setCreateOrganization('')
    setCreateErrors({})
  }

  function openCreateModal() {
    resetCreateForm()
    setCreateOpened(true)
  }

  function closeCreateModal() {
    if (createSubmitting) {
      return
    }

    setCreateOpened(false)
    setCreateErrors({})
  }

  function handleSearchChange(value: string) {
    setSearchValue(value)
    setPage(1)
  }

  function handleRefresh() {
    setRefreshToken(current => current + 1)
  }

  function handlePageSizeChange(value: string | null) {
    const nextPageSize = Number(value)

    if (!nextPageSize || nextPageSize === pageSize) {
      return
    }

    setPageSize(nextPageSize)
    setPage(1)
  }

  async function handleCreateProject() {
    const nextErrors: CreateFormErrors = {}
    const normalizedName = createName.trim()
    const normalizedOrganization = createOrganization.trim()

    if (!isValidProjectName(normalizedName)) {
      nextErrors.name
        = '项目名称需为 2-63 位小写字母、数字或连字符，且首尾必须是字母或数字。'
    }

    if (createUseRegistry && !createRegistryId) {
      nextErrors.registryId = '请选择代理仓库。'
    }

    if (createUseRegistry && !normalizedOrganization) {
      nextErrors.organization = '启用代理时必须填写 Organization 或用户名。'
    }

    if (Object.keys(nextErrors).length > 0) {
      setCreateErrors(nextErrors)

      return
    }

    setCreateSubmitting(true)
    setCreateErrors({})

    const createRequest = {
      name: normalizedName,
      type: createIsPublic
        ? ProjectType.PROJECT_TYPE_PUBLIC
        : ProjectType.PROJECT_TYPE_PRIVATE,
      registryId: createUseRegistry && createRegistryId
        ? {
            value: Number(createRegistryId),
          }
        : undefined,
      organization: createUseRegistry ? normalizedOrganization : undefined,
    }

    try {
      await Projects.CreateProject(createRequest)

      setCreateOpened(false)
      resetCreateForm()
      setPage(1)
      setRefreshToken(current => current + 1)
      setCreateSubmitting(false)
    } catch (error) {
      setCreateErrors({
        submit: getErrorMessage(error, '创建项目失败'),
      })
      setCreateSubmitting(false)
    }
  }

  function openDeleteModal(project: Project) {
    setDeleteError(null)
    setProjectToDelete(project)
  }

  function closeDeleteModal() {
    if (deleteSubmitting) {
      return
    }

    setDeleteError(null)
    setProjectToDelete(null)
  }

  async function handleDeleteProject() {
    if (!projectToDelete?.name) {
      return
    }

    setDeleteSubmitting(true)
    setDeleteError(null)

    const shouldGoPreviousPage = projectsState.items.length === 1 && page > 1

    try {
      await Projects.DeleteProject({
        name: projectToDelete.name,
      })
    } catch (error) {
      setDeleteError(getErrorMessage(error, '删除项目失败'))
      setDeleteSubmitting(false)

      return
    }

    if (shouldGoPreviousPage) {
      setPage(current => current - 1)
    } else {
      setRefreshToken(current => current + 1)
    }

    setProjectToDelete(null)
    setDeleteSubmitting(false)
  }

  return (
    <>
      <Stack gap="lg">
        <Stack gap={4}>
          <Title order={3}>项目管理</Title>
          <Text c="dimmed" size="sm">
            查看项目资源统计、代理仓库状态，并在这里创建或删除项目。
          </Text>
        </Stack>

        <Paper
          withBorder
          radius="md"
          p="lg"
          shadow="xs"
          style={{ position: 'relative' }}
        >
          <LoadingOverlay visible={projectsState.loading} zIndex={10} />

          <Stack gap="md">
            <Group justify="space-between" align="flex-end" wrap="wrap">
              <TextInput
                label="搜索项目"
                placeholder="请输入项目名称搜索"
                value={searchValue}
                onChange={event => handleSearchChange(event.currentTarget.value)}
                style={{ flex: '1 1 320px' }}
              />

              <Group gap="sm">
                <Button variant="default" onClick={handleRefresh}>
                  刷新
                </Button>
                <Button onClick={openCreateModal}>创建项目</Button>
              </Group>
            </Group>

            {projectsState.error
              ? (
                  <Alert color="red" title="加载失败">
                    {projectsState.error}
                  </Alert>
                )
              : null}

            <Table.ScrollContainer minWidth={920}>
              <Table
                striped
                highlightOnHover
                horizontalSpacing="md"
                verticalSpacing="sm"
              >
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>项目名称</Table.Th>
                    <Table.Th>类型</Table.Th>
                    <Table.Th>代理</Table.Th>
                    <Table.Th>模型数量</Table.Th>
                    <Table.Th>数据集数量</Table.Th>
                    <Table.Th>最新更新时间</Table.Th>
                    <Table.Th>操作</Table.Th>
                  </Table.Tr>
                </Table.Thead>

                <Table.Tbody>
                  {hasProjects
                    ? (
                        projectsState.items.map(project => (
                          <Table.Tr key={project.name}>
                            <Table.Td>
                              {project.name
                                ? (
                                    <Link
                                      to="/projects/$projectId"
                                      params={{
                                        projectId: project.name,
                                      }}
                                      style={{
                                        color: 'var(--mantine-color-blue-6)',
                                        fontWeight: 600,
                                        textDecoration: 'none',
                                      }}
                                    >
                                      {project.name}
                                    </Link>
                                  )
                                : (
                                    '-'
                                  )}
                            </Table.Td>
                            <Table.Td>
                              <Badge
                                color={
                                  project.type === ProjectType.PROJECT_TYPE_PUBLIC
                                    ? 'blue'
                                    : 'gray'
                                }
                                variant="light"
                              >
                                {formatProjectType(project.type)}
                              </Badge>
                            </Table.Td>
                            <Table.Td>
                              <Badge
                                color={project.enabledRegistry ? 'teal' : 'gray'}
                                variant="light"
                              >
                                {project.enabledRegistry ? '已启用' : '未启用'}
                              </Badge>
                            </Table.Td>
                            <Table.Td>{project.modelCount ?? 0}</Table.Td>
                            <Table.Td>{project.datasetCount ?? 0}</Table.Td>
                            <Table.Td>{formatTimestamp(project.updatedAt)}</Table.Td>
                            <Table.Td>
                              <Group gap="xs">
                                {project.name
                                  ? (
                                      <Link
                                        to="/projects/$projectId"
                                        params={{
                                          projectId: project.name,
                                        }}
                                        style={{
                                          color: 'var(--mantine-color-blue-6)',
                                          fontSize: 'var(--mantine-font-size-sm)',
                                          textDecoration: 'none',
                                        }}
                                      >
                                        查看
                                      </Link>
                                    )
                                  : null}
                                <Button
                                  variant="subtle"
                                  color="red"
                                  size="compact-sm"
                                  onClick={() => openDeleteModal(project)}
                                  disabled={!project.name}
                                >
                                  删除
                                </Button>
                              </Group>
                            </Table.Td>
                          </Table.Tr>
                        ))
                      )
                    : (
                        <Table.Tr>
                          <Table.Td colSpan={7}>
                            <Text py="xl" ta="center" c="dimmed">
                              {projectsState.error
                                ? '项目数据暂时不可用。'
                                : debouncedSearchValue
                                  ? '没有匹配的项目。'
                                  : '暂无项目，点击右上角创建项目。'}
                            </Text>
                          </Table.Td>
                        </Table.Tr>
                      )}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>

            <Group justify="space-between" align="center" wrap="wrap">
              <Text size="sm" c="dimmed">
                共
                {' '}
                {projectsState.total}
                {' '}
                条记录
              </Text>

              <Group gap="sm" wrap="wrap">
                {totalPages > 1
                  ? (
                      <Pagination
                        value={page}
                        onChange={setPage}
                        total={totalPages}
                        size="sm"
                      />
                    )
                  : null}
                <Select
                  aria-label="每页条数"
                  value={String(pageSize)}
                  onChange={handlePageSizeChange}
                  data={PAGE_SIZE_OPTIONS}
                  allowDeselect={false}
                  w={108}
                />
              </Group>
            </Group>
          </Stack>
        </Paper>
      </Stack>

      <Modal
        opened={createOpened}
        onClose={closeCreateModal}
        title="创建项目"
        centered
        closeOnClickOutside={!createSubmitting}
        closeOnEscape={!createSubmitting}
      >
        <Stack gap="md">
          {createErrors.submit
            ? (
                <Alert color="red" title="创建失败">
                  {createErrors.submit}
                </Alert>
              )
            : null}

          <TextInput
            label="项目名称"
            placeholder="例如：project-01"
            value={createName}
            onChange={event => setCreateName(event.currentTarget.value)}
            error={createErrors.name}
            required
          />

          <Switch
            label="公开项目"
            checked={createIsPublic}
            onChange={event => setCreateIsPublic(event.currentTarget.checked)}
          />

          <Switch
            label="启用代理仓库"
            checked={createUseRegistry}
            onChange={(event) => {
              const checked = event.currentTarget.checked

              setCreateUseRegistry(checked)
              setCreateErrors(current => ({
                ...current,
                registryId: undefined,
                organization: undefined,
              }))

              if (!checked) {
                setCreateRegistryId(null)
                setCreateOrganization('')
              }
            }}
          />

          {createUseRegistry
            ? (
                <>
                  {registriesState.error
                    ? (
                        <Alert color="red" title="代理仓库不可用">
                          {registriesState.error}
                        </Alert>
                      )
                    : null}

                  <Select
                    label="代理仓库"
                    placeholder={
                      registriesState.loading
                        ? '正在加载仓库...'
                        : '请选择代理仓库'
                    }
                    value={createRegistryId}
                    onChange={setCreateRegistryId}
                    data={registryOptions}
                    error={createErrors.registryId}
                    disabled={registriesState.loading || registryOptions.length === 0}
                    searchable
                    clearable={false}
                    required
                  />

                  <TextInput
                    label="Organization / 用户名"
                    placeholder="例如：matrixhub-team"
                    value={createOrganization}
                    onChange={event => setCreateOrganization(event.currentTarget.value)}
                    error={createErrors.organization}
                    required
                  />

                  <Text size="xs" c="dimmed">
                    代理仓库适用于 Hugging Face 等镜像场景，请先在目标仓库平台创建同名仓库。
                  </Text>
                </>
              )
            : null}

          <Group justify="flex-end">
            <Button
              variant="default"
              onClick={closeCreateModal}
              disabled={createSubmitting}
            >
              取消
            </Button>
            <Button onClick={handleCreateProject} loading={createSubmitting}>
              确定
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Modal
        opened={projectToDelete !== null}
        onClose={closeDeleteModal}
        title="删除项目"
        centered
        closeOnClickOutside={!deleteSubmitting}
        closeOnEscape={!deleteSubmitting}
      >
        <Stack gap="md">
          {deleteError
            ? (
                <Alert color="red" title="删除失败">
                  {deleteError}
                </Alert>
              )
            : null}

          <Text size="sm">
            确定要删除项目
            {' '}
            <Text component="span" fw={700}>
              {projectToDelete?.name ?? '-'}
            </Text>
            {' '}
            吗？删除后项目下的模型、数据集与成员关系将不可恢复。
          </Text>

          <Group justify="flex-end">
            <Button
              variant="default"
              onClick={closeDeleteModal}
              disabled={deleteSubmitting}
            >
              取消
            </Button>
            <Button
              color="red"
              onClick={handleDeleteProject}
              loading={deleteSubmitting}
            >
              确定删除
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  )
}

function projectsReducer(
  state: ProjectsState,
  action: ProjectsAction,
): ProjectsState {
  switch (action.type) {
    case 'requestStarted':
      return {
        ...state,
        loading: true,
        error: null,
      }
    case 'requestSucceeded':
      return {
        items: action.items,
        total: action.total,
        pages: action.pages,
        loading: false,
        error: null,
      }
    case 'requestFailed':
      return {
        items: [],
        total: 0,
        pages: 0,
        loading: false,
        error: action.error,
      }
    default:
      return state
  }
}

function registriesReducer(
  state: RegistriesState,
  action: RegistriesAction,
): RegistriesState {
  switch (action.type) {
    case 'requestStarted':
      return {
        ...state,
        loading: true,
        error: null,
      }
    case 'requestSucceeded':
      return {
        items: action.items,
        loading: false,
        loaded: true,
        error: null,
      }
    case 'requestFailed':
      return {
        ...state,
        items: [],
        loading: false,
        error: action.error,
      }
    default:
      return state
  }
}

function formatProjectType(type?: ProjectType) {
  switch (type) {
    case ProjectType.PROJECT_TYPE_PUBLIC:
      return '公开'
    case ProjectType.PROJECT_TYPE_PRIVATE:
      return '私有'
    default:
      return '未设置'
  }
}

function formatTimestamp(value: Project['updatedAt']) {
  if (!value) {
    return '-'
  }

  if (typeof value === 'string') {
    const date = new Date(value)

    return Number.isNaN(date.getTime()) ? value : date.toLocaleString('zh-CN')
  }

  const seconds = Number(value.seconds ?? 0)
  const nanos = value.nanos ?? 0

  if (!seconds && !nanos) {
    return '-'
  }

  const date = new Date(seconds * 1000 + Math.floor(nanos / 1000000))

  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString('zh-CN')
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message
  }

  if (typeof error === 'object' && error !== null) {
    const maybeError = error as {
      error?: {
        message?: string
      }
      message?: string
    }

    if (maybeError.error?.message) {
      return maybeError.error.message
    }

    if (maybeError.message) {
      return maybeError.message
    }
  }

  return fallback
}

function isValidProjectName(value: string) {
  return value.length >= 2 && NAME_PATTERN.test(value)
}
