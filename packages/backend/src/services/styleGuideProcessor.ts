import { styleGuideAi } from "../ai/langchain-styleguide";
import { readTsxFiles, removeFileExtension } from "../utils/helpers";
import { Server } from "socket.io";
import path from "path";

export async function processStyleGuide(
    resizedFileContent: string,
    io: Server
) {
    const emitStyledComponent = (fileName: string, component: string) => {
        io.emit("styledComponent", {
            fileName,
            styledComponent: component,
        });
    };

    // Typography Component
    const typographyComponent = await styleGuideAi(
        {
            fileName: "typography",
            content: "There is no component to pass.",
        },
        resizedFileContent
    );
    if (typographyComponent) {
        emitStyledComponent("typography", typographyComponent as any);
    }

    // Color Component
    const colorComponent = await styleGuideAi(
        { fileName: "color", content: "There is no component to pass." },
        resizedFileContent
    );
    if (colorComponent) {
        emitStyledComponent("color", colorComponent as any);
    }

    // Process TSX Files
    const componentDirPath = path.join(
        __dirname,
        "@/frontend/src/components/custom-ui"
    );
    const txtFiles = await readTsxFiles(componentDirPath);

    for (const txtFile of txtFiles) {
        const styledComponent = await styleGuideAi(
            { fileName: txtFile.fileName, content: txtFile.content },
            resizedFileContent
        );

        if (styledComponent) {
            emitStyledComponent(
                removeFileExtension(txtFile.fileName),
                styledComponent as any
            );
        }
    }

    io.emit("done", { message: "All components processed." });
}
