import fs from 'fs/promises';
import path from 'path';

export async function resetChildServer() {
  const templateDirPath = path.join(__dirname, './child-server-template');
  const targetDirPath = path.join(__dirname, './child-server');
  await fs.rm(targetDirPath, { recursive: true });
  await fs.cp(templateDirPath, targetDirPath, {
    recursive: true,
  });

  console.log('Server reset!');
}
