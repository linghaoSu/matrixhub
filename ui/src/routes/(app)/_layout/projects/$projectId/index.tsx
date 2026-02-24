import {
  createFileRoute,
  redirect,
} from '@tanstack/react-router'

export const Route = createFileRoute('/(app)/_layout/projects/$projectId/')({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: '/projects/$projectId/models',
      params: { projectId: params.projectId },
    })
  },
})
