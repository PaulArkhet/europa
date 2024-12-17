import { Request, Response } from "express";
import { db } from "../../db/db";
import { styleguides } from "../../db/schemas/index";
import { eq, and, desc } from "drizzle-orm";
import dotenv from "dotenv";

dotenv.config();

export async function createStyleguide(
    req: Request,
    res: Response
): Promise<void> {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
            return;
        }

        const token = req.headers.authorization?.split(" ")[1];

        if (!token) {
            res.status(401).json({ success: false, message: "Unauthorized" });
            return;
        }

        const {
            filename,
            typography,
            colors,
            buttons,
            radiobuttons,
            textfields,
            toggle,
            checkboxes,
            internalnavigation,
            segmentedbutton,
            card,
            user_id,
        } = req.body;

        const [insertedStyleguide] = await db
            .insert(styleguides)
            .values({
                filename,
                typography: JSON.stringify(typography),
                colors: JSON.stringify(colors),
                buttons: JSON.stringify(buttons),
                radiobuttons: JSON.stringify(radiobuttons),
                textfields: JSON.stringify(textfields),
                toggle: JSON.stringify(toggle),
                checkboxes: JSON.stringify(checkboxes),
                internalnavigation: JSON.stringify(internalnavigation),
                segmentedbutton: JSON.stringify(segmentedbutton),
                card: JSON.stringify(card),
                user_id,
            })
            .returning();

        res.status(200).json({
            success: true,
            content: insertedStyleguide,
        });
    } catch (err) {
        console.error("Error creating style guide:", err);
        res.status(500).json({
            success: false,
            message: "Error creating style guide",
        });
    }
}

export async function getStyleguides(
    req: Request,
    res: Response
): Promise<void> {
    try {
        const user_id = req.params.user_id;

        const styleguidesData = await db
            .select()
            .from(styleguides)
            .where(and(eq(styleguides.user_id, user_id)));

        res.status(200).json({
            success: true,
            content: styleguidesData,
        });
    } catch (err) {
        console.error("Error getting style guides:", err);
        res.status(500).json({
            success: false,
            message: "Error getting style guides",
        });
    }
}

export async function getStyleguideFilenames(
    req: Request,
    res: Response
): Promise<void> {
    try {
        const user_id = req.params.user_id;

        const filenames = await db
            .select({
                id: styleguides.styleguide_id,
                title: styleguides.filename,
                created_at: styleguides.created_at,
            })
            .from(styleguides)
            .where(eq(styleguides.user_id, user_id))
            .orderBy(desc(styleguides.created_at));

        res.status(200).json({
            success: true,
            content: filenames,
        });
    } catch (err) {
        console.error("Error getting style guide titles:", err);
        res.status(500).json({
            success: false,
            message: "Error getting style guide titles",
        });
    }
}

export async function getLatestStyleguide(
    req: Request,
    res: Response
): Promise<void> {
    try {
        const user_id = req.params.user_id;

        const [latestStyleguide] = await db
            .select()
            .from(styleguides)
            .where(eq(styleguides.user_id, user_id))
            .orderBy(desc(styleguides.created_at))
            .limit(1);

        if (latestStyleguide) {
            res.status(200).json({
                success: true,
                content: latestStyleguide,
            });
        } else {
            res.status(200).json({
                success: true,
                content: null,
                message: "No style guides found for the specified user.",
            });
        }
    } catch (err) {
        console.error("Error getting the latest style guide:", err);
        res.status(500).json({
            success: false,
            message: "Error getting the latest style guide",
        });
    }
}

export async function getStyleguideById(
    req: Request,
    res: Response
): Promise<void> {
    try {
        const { styleguide_id: styleguideIdString, user_id } = req.params;

        const styleguide_id = parseInt(styleguideIdString);

        const styleguideById = await db
            .select()
            .from(styleguides)
            .where(
                and(
                    eq(styleguides.styleguide_id, styleguide_id),
                    eq(styleguides.user_id, user_id)
                )
            )
            .orderBy(desc(styleguides.created_at))
            .limit(1);

        res.status(200).json({
            success: true,
            content: styleguideById,
        });
    } catch (err) {
        console.error("Error getting style guide titles:", err);
        res.status(500).json({
            success: false,
            message: "Error getting style guide titles",
        });
    }
}

export async function deleteStyleguideById(req: Request, res: Response) {
    const { styleguide_id: styleguideIdString, user_id } = req.params;

    const styleguide_id = parseInt(styleguideIdString);

    try {
        const styleguideToDelete = await db
            .select()
            .from(styleguides)
            .where(
                and(
                    eq(styleguides.styleguide_id, styleguide_id),
                    eq(styleguides.user_id, user_id)
                )
            )
            .limit(1);

        if (styleguideToDelete.length === 0) {
            res.status(404).json({
                success: false,
                message: "Style guide not found",
            });
        }

        await db
            .delete(styleguides)
            .where(
                and(
                    eq(styleguides.styleguide_id, styleguide_id),
                    eq(styleguides.user_id, user_id)
                )
            );

        res.status(200).json({
            success: true,
            message: "Style guide deleted",
        });
    } catch (error) {
        console.error("Error deleting style guide:", error);
        res.status(500).json({
            success: false,
            message: "Error deleting style guide",
        });
    }
}

export async function updateStyleguideById(req: Request, res: Response) {
    const { styleguide_id: styleguideIdString, user_id } = req.params;

    if (!styleguideIdString || !user_id) {
        res.status(400).json({
            success: false,
            message: "Styleguide ID and user ID are required",
        });
        return;
    }

    const styleguide_id = parseInt(styleguideIdString);
    const { componentType, updatedStyles } = req.body;

    if (!componentType || !updatedStyles) {
        res.status(400).json({
            success: false,
            message: "Component type and updated styles are required",
        });
        return;
    }

    const columnMapping: { [key: string]: keyof typeof styleguides } = {
        filename: "filename",
        typography: "typography",
        colors: "colors",
        buttons: "buttons",
        radiobuttons: "radiobuttons",
        textfields: "textfields",
        toggle: "toggle",
        checkboxes: "checkboxes",
        internalnavigation: "internalnavigation",
        segmentedbutton: "segmentedbutton",
        card: "card",
    };

    const columnToUpdate = columnMapping[componentType];

    if (!columnToUpdate) {
        res.status(400).json({
            success: false,
            message: "Invalid component type",
        });
        return;
    }

    try {
        const updatedStyleguide = await db
            .update(styleguides)
            .set({
                [columnToUpdate]: JSON.stringify(updatedStyles),
                edited_at: new Date(),
            })
            .where(
                and(
                    eq(styleguides.styleguide_id, styleguide_id),
                    eq(styleguides.user_id, user_id)
                )
            );

        res.status(200).json({
            success: true,
            content: updatedStyleguide,
        });
    } catch (error) {
        console.error("Error updating style guide:", error);
        res.status(500).json({
            success: false,
            message: "Error updating style guide",
        });
    }
}
