import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router'
import { RouteLoading } from '../RouteLoading'

const Home = lazy(() =>
  import('../../pages/Home').then(({ Home: HomePage }) => ({
    default: HomePage,
  })),
)

export const App = () => (
  <Routes>
    <Route
      path="/"
      element={
        <Suspense fallback={<RouteLoading />}>
          <Home />
        </Suspense>
      }
    />
  </Routes>
)
