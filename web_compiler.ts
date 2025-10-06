import fs from "fs";
import path from "path";

const __dirname = path.resolve();

interface IFile {
  path: string;
  content: string;
  name: string;
  type: string; // content-type
}

// Function to get content type based on file extension
function getContentType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const contentTypes: { [key: string]: string } = {
    ".html": "text/html",
    ".css": "text/css",
    ".js": "application/javascript",
    ".json": "application/json",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon",
    ".txt": "text/plain",
    ".pdf": "application/pdf",
  };
  return contentTypes[ext] || "application/octet-stream";
}

// Function to read files recursively
function readFilesSync(dir: string, baseDir: string) {
  const files = fs.readdirSync(dir);
  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const fileStat = fs.statSync(filePath);

    if (fileStat.isDirectory()) {
      readFilesSync(filePath, baseDir);
    } else {
      // Get relative path from public folder
      const relativePath = path.relative(baseDir, filePath).replace(/\\/g, "/");

      // Read file content and convert everything to base64
      const contentType = getContentType(filePath);
      const buffer = fs.readFileSync(filePath);
      const content = buffer.toString("base64");

      panelFiles.push({
        path: `/${relativePath}`,
        content: content,
        name: file,
        type: contentType,
      });

      console.log(`Added: ${relativePath} (${contentType})`);
    }
  });
}

// Generate TypeScript content
const tsContent = (
  files: IFile[]
) => `// Auto-generated file - DO NOT EDIT MANUALLY
// Generated at: ${new Date().toISOString()}

export interface ICompiledFile {
  path: string;
  content: string; // base64 encoded
  name: string;
  type: string;
}

export interface IDecodedFile {
  path: string;
  content: string | Buffer; // decoded content
  name: string;
  type: string;
}

export const publicFiles: ICompiledFile[] = ${JSON.stringify(files, null, 2)};

// Get file with base64 content (raw)
export function getFile(path: string): ICompiledFile | undefined {
  return publicFiles.find(file => file.path === path);
}

// Get file with decoded content
export function getDecodedFile(path: string): IDecodedFile | undefined {
  const file = publicFiles.find(file => file.path === path);
  if (!file) return undefined;
  
  const isTextFile = file.type.startsWith('text/') || 
                    file.type === 'application/javascript' || 
                    file.type === 'application/json';
  
  const content = isTextFile 
    ? Buffer.from(file.content, 'base64').toString('utf-8')
    : Buffer.from(file.content, 'base64');
  
  return {
    path: file.path,
    content: content,
    name: file.name,
    type: file.type
  };
}

// Get file content as string (for text files)
export function getFileContent(path: string): string | undefined {
  const decodedFile = getDecodedFile(path);
  if (!decodedFile) return undefined;
  
  return typeof decodedFile.content === 'string' 
    ? decodedFile.content 
    : decodedFile.content.toString('utf-8');
}

// Get file content as Buffer (for binary files)
export function getFileBuffer(path: string): Buffer | undefined {
  const file = getFile(path);
  if (!file) return undefined;
  
  return Buffer.from(file.content, 'base64');
}

export function getFilesByType(type: string): ICompiledFile[] {
  return publicFiles.filter(file => file.type.startsWith(type));
}

export function getAllFiles(): ICompiledFile[] {
  return publicFiles;
}

export function getAllDecodedFiles(): IDecodedFile[] {
  return publicFiles.map(file => {
    const decoded = getDecodedFile(file.path);
    return decoded!;
  });
}
`;

// -------- Main Function -------- //

const panelPath = path.join(__dirname, "panel");

const panelFiles: IFile[] = [];

// Function to read files into specific array
function readFilesIntoArray(
  dir: string,
  baseDir: string,
  targetArray: IFile[]
) {
  const files = fs.readdirSync(dir);
  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const fileStat = fs.statSync(filePath);

    if (fileStat.isDirectory()) {
      readFilesIntoArray(filePath, baseDir, targetArray);
    } else {
      // Get relative path from base folder
      const relativePath = path.relative(baseDir, filePath).replace(/\\/g, "/");

      // Read file content and convert everything to base64
      const contentType = getContentType(filePath);
      const buffer = fs.readFileSync(filePath);
      const content = buffer.toString("base64");

      targetArray.push({
        path: `/${relativePath}`,
        content: content,
        name: file,
        type: contentType,
      });

      console.log(`Added: ${relativePath} (${contentType})`);
    }
  });
}

// Read all files from panel directory
console.log("Reading files from panel directory...");
readFilesIntoArray(panelPath, panelPath, panelFiles);

// Save to panel_compiled.ts
const panelCompiledPath = path.join(__dirname, "panel_compiled.ts");
fs.writeFileSync(panelCompiledPath, tsContent(panelFiles), "utf-8");

console.log(`\nCompilation complete!`);
console.log(`Files compiled: ${panelFiles.length}`);
console.log(`Output: ${panelCompiledPath}`);
console.log("\nFile list:");
panelFiles.forEach((file) => {
  console.log(`  - ${file.path} (${file.type})`);
});
