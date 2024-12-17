import type { PageStructure } from "../langgraph";
import { editToolImpl } from "../tools/filesystemTools";
import { EOL } from "os";

// given a page structure, we need to:
// edit router.tsx to have all routes
// create each page/index.tsx file

async function createPage(page: PageStructure[number]) {
  const code = `
  import React from 'react';

  const Page: React.FC = () => {
    return (
      <div>
        <h1>${page.name} Page</h1>
        <p>This is a placeholder for the ${page.name} page.</p>
      </div>
    );
  };

  export default Page;
  `;
  const path = `src/pages/${page.name}/page.tsx`;

  await editToolImpl({ reasoning: "", code, filePath: path });
}

export async function generateRouterStructure(structure: PageStructure) {
  const createPagesPromises = structure.map(createPage);
  await Promise.all(createPagesPromises);

  const routerContents = structure.map(
    (page) =>
      ` <Route path="${page.path!}" element={<${capitalizeFirst(page.name)}Page />} />`
  );

  const routerImport = structure.map(
    (page) =>
      `import ${capitalizeFirst(page.name)}Page from './pages/${page.name}/page';`
  );

  const router = `
  import React from 'react';
  import {
    createBrowserRouter,
    createRoutesFromElements,
    Route,
  } from 'react-router-dom';
  import Layout from './layout';

  ${routerImport.join(EOL)}

  export function Router() {
    const router = createBrowserRouter(
      createRoutesFromElements(
        <Route element={<Layout />}>
          ${routerContents.join(EOL)}
        </Route>
      )
    );
    return router;
  };

  `;

  /*
export function Router() {
  const router = createBrowserRouter(
      createRoutesFromElements(
          <Route element={<Layout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/artboard" element={<Artboard />} />
              <Route path="/designsystem" element={<DesignSystemPage />} />
              <Route path="/dataset" element={<DataSetPage />} />
              <Route path="/*" element={<Dashboard />} />
          </Route>
      )
  );
  return router;
}
*/

  await editToolImpl({
    reasoning: "",
    filePath: "src/router.tsx",
    code: router,
  });
}

function capitalizeFirst(input: string) {
  const chars = input.split("");
  chars[0] = chars[0].toUpperCase();
  return chars.join("");
}
