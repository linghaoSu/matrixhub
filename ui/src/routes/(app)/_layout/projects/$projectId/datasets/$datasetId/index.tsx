import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/(app)/_layout/projects/$projectId/datasets/$datasetId/',
)({
  component: RouteComponent,
})

function RouteComponent() {
  const {
    projectId, datasetId,
  } = Route.useParams()

  return (
    <div>
      Dataset Detail Page
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
