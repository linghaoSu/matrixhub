import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/(app)/_layout/projects/$projectId/models/$modelId/settings/',
)({
  component: RouteComponent,
})

function RouteComponent() {
  const {
    projectId, modelId,
  } = Route.useParams()

  return (
    <div>
      Model Settings Form
      <br />
      Project ID:
      {' '}
      {projectId}
      <br />
      Model ID:
      {' '}
      {modelId}
    </div>
  )
}
