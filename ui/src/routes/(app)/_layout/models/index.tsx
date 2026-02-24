import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/(app)/_layout/models/')({
  component: RouteComponent,
  staticData: {
    navName: 'Models',
  },
})

function RouteComponent() {
  return <div>Models Page</div>
}
