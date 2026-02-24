import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/(app)/_layout/projects/')({
  component: RouteComponent,
  staticData: {
    navName: 'Projects',
  },
})

function RouteComponent() {
  return <div>Projects Page</div>
}
