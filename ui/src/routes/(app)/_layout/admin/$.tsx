import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/(app)/_layout/admin/$')({
  component: RouteComponent,
  staticData: {
    navName: 'Admin Settings',
  },
})

function RouteComponent() {
  return <div>Admin Settings Page</div>
}
