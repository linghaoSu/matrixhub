import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/(app)/_layout/projects/$projectId/models/$modelId/commits/$ref/',
)({
  component: RouteComponent,
})

function RouteComponent() {
  const {
    projectId, modelId, ref,
  } = Route.useParams()

  return (
    <div>
      Model Commits History
      <br />
      Project ID:
      {' '}
      {projectId}
      <br />
      Model ID:
      {' '}
      {modelId}
      <br />
      Ref:
      {' '}
      {ref}
    </div>
  )
}
