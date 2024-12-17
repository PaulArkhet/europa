import express from "express";
import {
    createProject,
    deleteProject,
    getProject,
    getProjects,
    updateProjectName,
    updateWireframe,
} from "../src/controllers/projects";

const projects = express.Router();

//@ts-ignore
projects.route("/").post(createProject);
projects.route("/:user_id").get(getProjects);
projects.route("/project/:project_id").get(getProject).patch(updateProjectName);
projects.route("/project/wireframe/:project_id").post(updateWireframe);
projects.route("/project/delete/:project_id").post(deleteProject);

export default projects;
