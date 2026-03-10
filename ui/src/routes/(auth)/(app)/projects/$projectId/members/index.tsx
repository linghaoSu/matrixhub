import {
  ActionIcon,
  Avatar,
  Button,
  Checkbox,
  Group,
  Modal,
  Pagination,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import {
  MemberType, Projects, type ProjectMember,
} from '@matrixhub/api-ts/v1alpha1/project.pb'
import { ProjectRoleType } from '@matrixhub/api-ts/v1alpha1/role.pb'
import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

export const Route = createFileRoute(
  '/(auth)/(app)/projects/$projectId/members/',
)({
  component: ProjectMembers,
})

function useRoleLabel() {
  const { t } = useTranslation()

  return (role?: ProjectRoleType) => {
    switch (role) {
      case ProjectRoleType.ROLE_TYPE_PROJECT_ADMIN: return t('project.members.roleAdmin')
      case ProjectRoleType.ROLE_TYPE_PROJECT_EDITOR: return t('project.members.roleEditor')
      case ProjectRoleType.ROLE_TYPE_PROJECT_VIEWER: return t('project.members.roleViewer')
      default: return role ?? ''
    }
  }
}

function useMemberTypeLabel() {
  const { t } = useTranslation()

  return (memberType?: MemberType) => {
    switch (memberType) {
      case MemberType.MEMBER_TYPE_GROUP: return t('project.members.group')
      default: return t('project.members.user')
    }
  }
}

function useRoleOptions() {
  const { t } = useTranslation()

  return [
    {
      value: ProjectRoleType.ROLE_TYPE_PROJECT_ADMIN,
      label: t('project.members.roleAdmin'),
    },
    {
      value: ProjectRoleType.ROLE_TYPE_PROJECT_EDITOR,
      label: t('project.members.roleEditor'),
    },
    {
      value: ProjectRoleType.ROLE_TYPE_PROJECT_VIEWER,
      label: t('project.members.roleViewer'),
    },
  ]
}

function useMemberTypeOptions() {
  const { t } = useTranslation()

  return [
    {
      value: MemberType.MEMBER_TYPE_USER,
      label: t('project.members.user'),
    },
    {
      value: MemberType.MEMBER_TYPE_GROUP,
      label: t('project.members.group'),
    },
  ]
}

function getMemberId(member: ProjectMember) {
  return member.memberId ?? ''
}

interface ProjectMembersListState {
  members: ProjectMember[]
  page: number
  search: string
  total: number
  totalPages: number
}

const initialListState: ProjectMembersListState = {
  members: [],
  page: 1,
  search: '',
  total: 0,
  totalPages: 1,
}

function useProjectMembersList(projectId: string) {
  const [state, setState] = useState<ProjectMembersListState>(initialListState)
  const [refreshKey, setRefreshKey] = useState(0)
  const pageSize = 10

  useEffect(() => {
    let active = true

    Projects.ListProjectMembers({
      name: projectId,
      memberName: state.search || undefined,
      page: state.page,
      pageSize,
    }).then((resp) => {
      if (!active) {
        return
      }

      setState(prev => ({
        ...prev,
        members: resp.members ?? [],
        totalPages: resp.pagination?.pages ?? 1,
        total: resp.pagination?.total ?? 0,
      }))
    }).catch(() => {
      if (!active) {
        return
      }

      setState(prev => ({
        ...prev,
        members: [],
      }))
    })

    return () => {
      active = false
    }
  }, [pageSize, projectId, refreshKey, state.page, state.search])

  return {
    ...state,
    refresh: () => setRefreshKey(key => key + 1),
    setPage: (page: number) => setState(prev => ({
      ...prev,
      page,
    })),
    setSearch: (search: string) => setState(prev => ({
      ...prev,
      search,
      page: 1,
    })),
  }
}

function useMemberSelection(members: ProjectMember[]) {
  const [selected, setSelected] = useState<Set<string>>(() => new Set())

  const selectableMembers = members.filter(member => getMemberId(member) !== '')
  const selectedCount = selectableMembers.filter(member => selected.has(getMemberId(member))).length

  const toggleSelect = (memberId: string) => {
    setSelected((prev) => {
      const next = new Set(prev)

      if (next.has(memberId)) {
        next.delete(memberId)
      } else {
        next.add(memberId)
      }

      return next
    })
  }

  return {
    selected,
    selectedCount,
    selectableMembers,
    clearSelection: () => setSelected(() => new Set()),
    toggleSelect,
    toggleSelectAll: () => setSelected(() => {
      if (selectedCount === selectableMembers.length) {
        return new Set()
      }

      return new Set(selectableMembers.map(getMemberId))
    }),
  }
}

function ProjectMembers() {
  const { projectId } = Route.useParams()
  const { t } = useTranslation()
  const getRoleLabel = useRoleLabel()
  const getMemberTypeLabel = useMemberTypeLabel()
  const roleOptions = useRoleOptions()
  const memberTypeOptions = useMemberTypeOptions()

  const {
    members,
    page,
    refresh,
    search,
    setPage,
    setSearch,
    total,
    totalPages,
  } = useProjectMembersList(projectId)
  const {
    clearSelection,
    selectableMembers,
    selected,
    selectedCount,
    toggleSelect,
    toggleSelectAll,
  } = useMemberSelection(members)

  // Add member modal
  const [addOpened, {
    open: openAdd, close: closeAdd,
  }] = useDisclosure(false)
  const [newMemberType, setNewMemberType] = useState<string>(MemberType.MEMBER_TYPE_USER)
  const [newMemberId, setNewMemberId] = useState('')
  const [newMemberRole, setNewMemberRole] = useState<string>(ProjectRoleType.ROLE_TYPE_PROJECT_ADMIN)

  // Edit role modal
  const [editOpened, {
    open: openEdit, close: closeEdit,
  }] = useDisclosure(false)
  const [editingMember, setEditingMember] = useState<ProjectMember | null>(null)
  const [editRole, setEditRole] = useState<string>('')

  // Remove confirm modal
  const [removeOpened, {
    open: openRemove, close: closeRemove,
  }] = useDisclosure(false)
  const [removingMembers, setRemovingMembers] = useState<ProjectMember[]>([])

  const handleAddMember = async () => {
    try {
      await Projects.AddProjectMemberWithRole({
        name: projectId,
        memberType: newMemberType as MemberType,
        memberId: newMemberId,
        role: newMemberRole as ProjectRoleType,
      })
      closeAdd()
      setNewMemberId('')
      setNewMemberType(MemberType.MEMBER_TYPE_USER)
      setNewMemberRole(ProjectRoleType.ROLE_TYPE_PROJECT_ADMIN)
      refresh()
    } catch {
      // handle error
    }
  }

  const handleEditRole = async () => {
    if (!editingMember) {
      return
    }
    try {
      await Projects.UpdateProjectMemberRole({
        name: projectId,
        memberType: editingMember.memberType,
        memberId: editingMember.memberId,
        role: editRole as ProjectRoleType,
      })
      closeEdit()
      setEditingMember(null)
      refresh()
    } catch {
      // handle error
    }
  }

  const handleRemoveMembers = async () => {
    try {
      await Projects.RemoveProjectMembers({
        name: projectId,
        members: removingMembers.map(m => ({
          memberType: m.memberType,
          memberId: m.memberId,
        })),
      })
      closeRemove()
      setRemovingMembers([])
      clearSelection()
      refresh()
    } catch {
      // handle error
    }
  }

  const openEditModal = (member: ProjectMember) => {
    setEditingMember(member)
    setEditRole(member.role ?? ProjectRoleType.ROLE_TYPE_PROJECT_VIEWER)
    openEdit()
  }

  const openBatchRemove = () => {
    const toRemove = members.filter(member => selected.has(getMemberId(member)))

    setRemovingMembers(toRemove)
    openRemove()
  }

  const openSingleRemove = (member: ProjectMember) => {
    setRemovingMembers([member])
    openRemove()
  }

  return (
    <Stack gap="md">
      {/* Toolbar */}
      <Group justify="space-between">
        <Group gap="sm">
          <TextInput
            size="sm"
            placeholder={t('project.search.member')}
            value={search}
            onChange={(e) => {
              setSearch(e.currentTarget.value)
              setPage(1)
            }}
            leftSection={<Text size="xs" c="dimmed">🔍</Text>}
            w={240}
          />
        </Group>
        <Group gap="sm">
          <ActionIcon variant="subtle" size="input-sm" onClick={refresh} title={t('project.members.refresh')}>
            <Text size="sm">↻</Text>
          </ActionIcon>
          <Button
            size="sm"
            variant="outline"
            color="gray"
            disabled={selected.size === 0}
            onClick={openBatchRemove}
          >
            🗑
            {' '}
            {t('project.members.batchDelete')}
          </Button>
          <Button size="sm" onClick={openAdd}>
            👥
            {' '}
            {t('project.members.add')}
          </Button>
        </Group>
      </Group>

      {/* Table */}
      <Table highlightOnHover verticalSpacing="sm">
        <Table.Thead>
          <Table.Tr>
            <Table.Th w={40}>
              <Checkbox
                checked={selectableMembers.length > 0 && selectedCount === selectableMembers.length}
                indeterminate={selectedCount > 0 && selectedCount < selectableMembers.length}
                onChange={toggleSelectAll}
              />
            </Table.Th>
            <Table.Th>{t('project.members.colName')}</Table.Th>
            <Table.Th>{t('project.members.colMemberType')}</Table.Th>
            <Table.Th>{t('project.members.colRoleType')}</Table.Th>
            <Table.Th>{t('project.members.colActions')}</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {members.map(member => (
            <Table.Tr
              key={getMemberId(member) || member.memberName || 'member-row'}
              bg={selected.has(getMemberId(member)) ? 'var(--mantine-color-blue-0)' : undefined}
            >
              <Table.Td>
                <Checkbox
                  checked={selected.has(getMemberId(member))}
                  disabled={!getMemberId(member)}
                  onChange={() => toggleSelect(getMemberId(member))}
                />
              </Table.Td>
              <Table.Td>
                <Group gap="sm">
                  <Avatar size="sm" radius="xl" color="gray">
                    {(member.memberName ?? '?')[0]?.toUpperCase()}
                  </Avatar>
                  <Text size="sm">{member.memberName}</Text>
                </Group>
              </Table.Td>
              <Table.Td>
                <Text size="sm">{getMemberTypeLabel(member.memberType)}</Text>
              </Table.Td>
              <Table.Td>
                <Text size="sm">{getRoleLabel(member.role)}</Text>
              </Table.Td>
              <Table.Td>
                <Group gap="md">
                  <Text
                    size="sm"
                    c="teal"
                    style={{ cursor: 'pointer' }}
                    onClick={() => openEditModal(member)}
                  >
                    {t('project.members.editRole')}
                  </Text>
                  <Text
                    size="sm"
                    c="teal"
                    style={{ cursor: 'pointer' }}
                    onClick={() => openSingleRemove(member)}
                  >
                    {t('project.members.delete')}
                  </Text>
                </Group>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>

      {members.length === 0 && (
        <Text c="dimmed" ta="center" py="xl">
          {t('project.noMembers')}
        </Text>
      )}

      {/* Pagination */}
      <Group justify="space-between">
        <Text size="sm" c="dimmed">
          {t('project.totalRecords', { count: total })}
        </Text>
        <Pagination
          total={totalPages}
          value={page}
          onChange={setPage}
          size="sm"
        />
      </Group>

      {/* ===== Add Member Modal ===== */}
      <Modal opened={addOpened} onClose={closeAdd} title={t('project.members.addTitle')}>
        <Stack gap="md">
          <Select
            label={(
              <Text size="sm" fw={500}>
                {t('project.members.colMemberType')}
                {' '}
                <Text component="span" c="red">*</Text>
              </Text>
            )}
            value={newMemberType}
            onChange={v => setNewMemberType(v ?? MemberType.MEMBER_TYPE_USER)}
            data={memberTypeOptions}
          />
          <Select
            label={(
              <Text size="sm" fw={500}>
                {t('project.members.userLabel')}
                {' '}
                <Text component="span" c="red">*</Text>
              </Text>
            )}
            placeholder={t('project.members.selectUser')}
            value={newMemberId || null}
            onChange={v => setNewMemberId(v ?? '')}
            data={[]}
            searchable
          />
          <Select
            label={(
              <Text size="sm" fw={500}>
                {t('project.members.colRoleType')}
                {' '}
                <Text component="span" c="red">*</Text>
              </Text>
            )}
            value={newMemberRole}
            onChange={v => setNewMemberRole(v ?? ProjectRoleType.ROLE_TYPE_PROJECT_ADMIN)}
            data={roleOptions}
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={closeAdd}>{t('common.cancel')}</Button>
            <Button onClick={handleAddMember} disabled={!newMemberId}>{t('common.confirm')}</Button>
          </Group>
        </Stack>
      </Modal>

      {/* ===== Edit Role Modal ===== */}
      <Modal opened={editOpened} onClose={closeEdit} title={t('project.members.editRoleTitle')}>
        <Stack gap="md">
          <TextInput
            label={(
              <Text size="sm" fw={500}>
                {t('project.members.userLabel')}
                {' '}
                <Text component="span" c="red">*</Text>
              </Text>
            )}
            value={editingMember?.memberName ?? ''}
            readOnly
            styles={{ input: { backgroundColor: 'var(--mantine-color-gray-1)' } }}
          />
          <Select
            label={(
              <Text size="sm" fw={500}>
                {t('project.members.colRoleType')}
                {' '}
                <Text component="span" c="red">*</Text>
              </Text>
            )}
            value={editRole}
            onChange={v => setEditRole(v ?? '')}
            data={roleOptions}
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={closeEdit}>{t('common.cancel')}</Button>
            <Button onClick={handleEditRole}>{t('common.confirm')}</Button>
          </Group>
        </Stack>
      </Modal>

      {/* ===== Remove Confirm Modal ===== */}
      <Modal
        opened={removeOpened}
        onClose={closeRemove}
        title={(
          <Group gap="xs">
            <Text c="orange" fw={700}>⚠</Text>
            <Text fw={600}>
              {removingMembers.length === 1
                ? t('project.members.removeTitle')
                : t('project.members.batchRemoveTitle')}
            </Text>
          </Group>
        )}
      >
        <Stack gap="md">
          <Text size="sm">
            {removingMembers.length === 1
              ? t('project.members.removeConfirm', {
                  name: removingMembers[0]?.memberName,
                  project: projectId,
                  role: getRoleLabel(removingMembers[0]?.role),
                })
              : t('project.members.batchRemoveConfirm', {
                  count: removingMembers.length,
                  project: projectId,
                })}
          </Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={closeRemove}>{t('common.cancel')}</Button>
            <Button color="teal" onClick={handleRemoveMembers}>{t('common.confirm')}</Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  )
}
