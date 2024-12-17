import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
} from 'react-router-dom';
import { FoundationModel } from './components/FoundationModel';
import Layout from './layout';

export function Router() {
  const router = createBrowserRouter(
    createRoutesFromElements(
      <Route element={<Layout />}>
        <Route path="/" element={<>Sample Text</>} />
      </Route>
    )
  );
  return router;
}
