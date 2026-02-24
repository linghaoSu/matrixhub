import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/(app)/_layout/projects/$projectId/models/$modelId/blob/$ref/$',
)({
  component: RouteComponent,
})

function RouteComponent() {
  const {
    projectId, modelId, ref,
  } = Route.useParams()
  const filePath = Route.useParams({ select: s => s['_splat'] })

  return (
    <div>
      Model Blob Page
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
      File Path:
      {' '}
      {filePath}
    </div>
  )
}
