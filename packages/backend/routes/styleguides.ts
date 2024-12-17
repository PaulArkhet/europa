import express from "express";
import {
    createStyleguide,
    deleteStyleguideById,
    getLatestStyleguide,
    getStyleguideById,
    getStyleguideFilenames,
    getStyleguides,
    updateStyleguideById,
} from "../src/controllers/styleguides";

const styleguides = express.Router();

styleguides
    .route("/styleguide/:styleguide_id/user/:user_id")
    .get(getStyleguideById);
styleguides.route("/user/:user_id/filenames").get(getStyleguideFilenames);
styleguides.route("/user/:user_id/latest").get(getLatestStyleguide);
styleguides.route("/user/:user_id").get(getStyleguides);

styleguides.route("/").post(createStyleguide);

styleguides
    .route("/styleguide/:styleguide_id/user/:user_id")
    .put(updateStyleguideById);

styleguides
    .route("/styleguide/:styleguide_id/user/:user_id")
    .delete(deleteStyleguideById);

export default styleguides;
