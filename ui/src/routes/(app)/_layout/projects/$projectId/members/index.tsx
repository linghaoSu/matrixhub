import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/(app)/_layout/projects/$projectId/members/',
)({
  component: RouteComponent,
})

function RouteComponent() {
  const { projectId } = Route.useParams()

  return (
    <div>
      Project Members Page - Project ID:
      {projectId}
    </div>
  )
}
