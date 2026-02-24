import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/(app)/_layout/datasets/')({
  component: RouteComponent,
  staticData: {
    navName: 'Datasets',
  },
})

function RouteComponent() {
  return <div>Datasets Page</div>
}
