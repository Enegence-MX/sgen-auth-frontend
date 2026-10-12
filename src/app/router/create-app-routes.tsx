import { Navigate, type RouteObject } from 'react-router'
import { App } from '../App'
import { AuthLayout } from '../layouts/AuthLayout'
import { ProtectedLayout } from '../layouts/ProtectedLayout'
import { AuthPage } from '../pages/AuthPage'
import { OrganizationsPage } from '../pages/OrganizationsPage'
import { NewOrganizationPage } from '../pages/NewOrganizationPage'
import { OrganizationPage } from '../pages/OrganizationPage'
import { SessionPage } from '../pages/SessionPage'
import type { Services } from '../services/create-services'
import type { RouteMetadata } from './route-metadata'

export function createAppRoutes(services: Services): RouteObject[] {
  return [
    {
      path: '/styleguide',
      lazy: async () => ({ Component: (await import('../pages/StyleguidePage')).StyleguidePage }),
      handle: { module: 'styleguide' } satisfies RouteMetadata,
    },
    {
      path: '/',
      element: <App services={services} />,
      children: [
        {
          element: <AuthLayout />,
          children: [
            { path: 'login', element: <AuthPage />, handle: { module: 'login' } satisfies RouteMetadata },
          ],
        },
        {
          element: <ProtectedLayout />,
          children: [
            { index: true, element: <Navigate to="/organizations" replace /> },
            {
              path: 'organizations',
              element: <OrganizationsPage />,
              handle: { module: 'organizations' } satisfies RouteMetadata,
            },
            {
              path: 'organizations/new',
              element: <NewOrganizationPage />,
              handle: { module: 'newOrganization' } satisfies RouteMetadata,
            },
            {
              path: 'organizations/:id',
              element: <OrganizationPage />,
              handle: { module: 'organization' } satisfies RouteMetadata,
            },
            {
              path: 'session',
              element: <SessionPage />,
              handle: { module: 'session' } satisfies RouteMetadata,
            },
          ],
        },
        { path: '*', element: <Navigate to="/" replace /> },
      ],
    },
  ]
}
