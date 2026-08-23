import { Route, Routes } from 'react-router'
import { Home } from '../../pages/Home'

export const App = () => (
  <Routes>
    <Route path="/" element={<Home />} />
  </Routes>
)
