import path from "path";
import fs from "fs";
import { resizeImage } from "../utils/helpers";

export async function processUploadedFile(file: Express.Multer.File) {
    const fileMimeType = file.mimetype;

    if (fileMimeType !== "image/png" && fileMimeType !== "image/jpeg") {
        throw new Error("Invalid file type uploaded");
    }

    const outputFilePath = path.join(
        __dirname,
        "../../uploads",
        `resized-${file.filename}`
    );

    await resizeImage(file.path, outputFilePath);

    const fileBuffer = fs.readFileSync(outputFilePath).toString("base64");
    const base64Image = `data:${fileMimeType};base64,${fileBuffer}`;

    return {
        fileName: file.originalname,
        content: base64Image,
        fileType: fileMimeType,
    };
}
