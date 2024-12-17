import express from "express";
import { decryptToken, validateUser } from "../src/controllers/users";

const user = express.Router();

//@ts-ignore
user.route("/login").post(validateUser);
//@ts-ignore
user.route("/validation").post(decryptToken);

export default user;
