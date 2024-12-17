import { Request, Response } from "express";
import { db } from "../../db/db";
import { datasets } from "../../db/schemas/index";
import { eq } from "drizzle-orm";
import dotenv from "dotenv";

dotenv.config();

export async function createDataSet(req: Request, res: Response) {
    try {
        const user_id = req.body.user_id;
        const title = req.body.title;
        const headers = req.body.headers;
        const content = req.body.content;
        const now = new Date();
        const timestamp = now.toISOString();
        await db
            .insert(datasets)
            //@ts-ignore
            .values({
                user_id: user_id,
                title: title,
                headers: headers,
                content: content,
                created_at: timestamp,
                edited_at: timestamp,
            });
        const newDatasets = await db
            .select()
            .from(datasets)
            .where(eq(datasets.user_id, user_id));
        res.status(200).json({
            success: true,
            content: newDatasets[newDatasets.length - 1],
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            success: false,
            message: "Error creating dataset",
        });
    }
}

export async function getDatasets(req: Request, res: Response) {
    try {
        const user_id = req.params.user_id;
        const datasetsQuery = await db
            .select()
            .from(datasets)
            .where(eq(datasets.user_id, user_id));
        res.status(200).json(datasetsQuery);
    } catch (err) {
        console.log(err);
        res.status(500).json({
            success: false,
            message: "Error getting datasets",
        });
    }
}

export async function deleteDataset(req: Request, res: Response) {
    try {
        const dataset_id = req.params.dataset_id;
        const datasetsQuery = await db
            .update(datasets)
            .set({ active: false })
            //@ts-ignore
            .where(eq(datasets.dataset_id, dataset_id));
        res.status(200).json({ success: true });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            success: false,
            message: "Error deleting dataset",
        });
    }
}
