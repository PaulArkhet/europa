import fs from "fs/promises";
import path from "path";
import sharp from "sharp";

interface TsxFile {
    fileName: string;
    content: string;
}

export const readTsxFiles = async (
    directoryPath: string
): Promise<TsxFile[]> => {
    try {
        const files = await fs.readdir(directoryPath);
        const tsxFiles = files.filter((file) => path.extname(file) === ".tsx");

        const fileContents: TsxFile[] = await Promise.all(
            tsxFiles.map(async (file) => {
                const filePath = path.join(directoryPath, file);
                const content = await fs.readFile(filePath, "utf-8");
                return { fileName: file, content };
            })
        );

        return fileContents;
    } catch (error) {
        console.error("Error reading .tsx files:", error);
        throw new Error("Failed to read .tsx files from directory");
    }
};

export function chunkText(input: string, chunkSize: number): string[] {
    const chunks = [];
    for (let i = 0; i < input.length; i += chunkSize) {
        chunks.push(input.slice(i, i + chunkSize));
    }
    return chunks;
}

export function removeFileExtension(fileName: string): string {
    return fileName.toLowerCase().replace(/\.tsx$/, "");
}

export async function resizeImage(inputPath: string, outputPath: string) {
    try {
        await sharp(inputPath)
            .resize({
                width: 1568,
                height: 1568,
                fit: sharp.fit.inside,
                withoutEnlargement: true,
            })
            .toFile(outputPath);
    } catch (error) {
        console.error("Error resizing image:", error);
    }
}
