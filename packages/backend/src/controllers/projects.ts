import { Request, Response } from "express";
import { db } from "../../db/db";
import { projects } from "../../db/schemas/index";
import { eq, desc, and } from "drizzle-orm";

export async function createProject(req: Request, res: Response) {
    try {
        const title = req.body.title;
        if (title.length > 255) {
            return res.json({
                success: false,
                message: "Title max char limit is 32",
            });
        }
        const user_id = req.body.user_id;
        const [InsertedNewProject] = await db
            .insert(projects)
            .values({
                user_id,
                title,
                img_src: "",
                wireframe:
                    '[{"id":0,"xOffset":1560,"yOffset":1235.5,"width":800,"height":448,"minWidth":10,"minHeight":10,"isInstanceChild":false,"type":"page","subtype":"Desktop","title":"New Page","description":"Description & documentation - Lorem ipsum dolor sit amet, consectetur adipiscing elit."}]',
            })
            .returning();
        res.status(200).json({
            success: true,
            content: InsertedNewProject,
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            success: false,
            message: "Error creating project",
        });
    }
}

export async function getProjects(req: Request, res: Response) {
    try {
        const user_id = req.params.user_id;

        const projectsQuery = await db
            .select()
            .from(projects)
            .where(
                and(eq(projects.user_id, user_id), eq(projects.active, true))
            )
            .orderBy(desc(projects.edited_at));
        res.status(200).json(projectsQuery);
    } catch (error) {
        console.error("Error getting projects:", error);
        res.status(500).json({
            success: false,
            message: "Error getting projects",
        });
    }
}

export async function getProject(req: Request, res: Response) {
    try {
        const project_id = parseInt(req.params.project_id);
        const projectQuery = await db
            .select()
            .from(projects)
            .where(eq(projects.project_id, project_id));
        res.status(200).json(projectQuery);
    } catch (error) {
        console.error("Error getting project:", error);
        res.status(500).json({
            success: false,
            message: "Error getting project",
        });
    }
}

export async function updateProjectName(req: Request, res: Response) {
    try {
        const project_id = parseInt(req.params.project_id);
        const incomingTitle = req.body.title;
        await db
            .update(projects)
            .set({ title: incomingTitle, edited_at: new Date() })
            .where(eq(projects.project_id, project_id));
        res.status(200).json({ success: true });
    } catch (error) {
        console.error("Error updating project:", error);
        res.status(500).json({
            success: false,
            message: "Error updating project",
        });
    }
}

export async function updateWireframe(req: Request, res: Response) {
    try {
        const project_id = parseInt(req.params.project_id);
        const content = req.body.content;
        const currentTimestamp = new Date();

        await db
            .update(projects)
            .set({ wireframe: content, edited_at: currentTimestamp })
            .where(eq(projects.project_id, project_id));
        res.status(200).json({ success: true });
    } catch (error) {
        console.error("Error updating project:", error);
        res.status(500).json({
            success: false,
            message: "Error updating project",
        });
    }
}

export async function deleteProject(req: Request, res: Response) {
    try {
        const project_id = parseInt(req.params.project_id);
        const title = req.body.title;
        await db
            .update(projects)
            .set({ active: false })
            .where(eq(projects.project_id, project_id));
        res.status(200).json({ success: true });
    } catch (error) {
        console.error("Error deleting project:", error);
        res.status(500).json({
            success: false,
            message: "Error deleting project",
        });
    }
}
