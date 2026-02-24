import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/(app)/_layout/projects/$projectId/datasets/$datasetId/settings/',
)({
  component: RouteComponent,
})

function RouteComponent() {
  const {
    projectId, datasetId,
  } = Route.useParams()

  return (
    <div>
      Dataset Settings Form
      <br />
      Project ID:
      {' '}
      {projectId}
      <br />
      Dataset ID:
      {' '}
      {datasetId}
    </div>
  )
}
