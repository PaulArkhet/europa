import { Router } from './router';
import { RouterProvider } from 'react-router-dom';

function App() {
  const router = Router();

  return <RouterProvider router={router} />;
}

export default App;
