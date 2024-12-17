import express from "express";
import { createUser } from "../src/controllers/users";

const users = express.Router();

//@ts-ignore
users.route("/").post(createUser);

export default users;
