import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/(app)/_layout/profile/')({
  component: RouteComponent,
  staticData: {
    navName: 'Profile',
  },
})

function RouteComponent() {
  return <div>Profile Page</div>
}
