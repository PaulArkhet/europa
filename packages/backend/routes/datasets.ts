import express from "express";
import {
    createDataSet,
    deleteDataset,
    getDatasets,
} from "../src/controllers/datasets";

const datasets = express.Router();

datasets.route("/").post(createDataSet).get(getDatasets);
datasets.route("/:user_id").get(getDatasets);
datasets.route("/delete/:dataset_id").post(deleteDataset);

export default datasets;
