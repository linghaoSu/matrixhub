import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/(app)/_layout/projects/$projectId/models/$modelId/commit/$commitId/',
)({
  component: RouteComponent,
})

function RouteComponent() {
  const {
    projectId, modelId, commitId,
  } = Route.useParams()

  return (
    <div>
      Model Commit Details
      <br />
      Project ID:
      {' '}
      {projectId}
      <br />
      Model ID:
      {' '}
      {modelId}
      <br />
      Commit ID:
      {' '}
      {commitId}
    </div>
  )
}
