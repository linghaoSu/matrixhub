import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/(app)/_layout/projects/$projectId/models/$modelId/tree/$ref/$',
)({
  component: RouteComponent,
})

function RouteComponent() {
  const {
    projectId, modelId, ref,
  } = Route.useParams()
  // Catch-all param comes from the `_splat` parameter in TanStack Router
  const treePath = Route.useParams({ select: s => s['_splat'] })

  return (
    <div>
      Model Tree Page
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
      <br />
      Path:
      {' '}
      {treePath}
    </div>
  )
}
