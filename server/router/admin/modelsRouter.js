const express = require('express');
const router = express.Router();
const modelsController = require('../../controller/admin/modelsController');
const upload = modelsController.upload;

// GET all models
router.get('/', modelsController.getAllModels);

// GET single model
router.get('/:id', modelsController.getModelById);

// ADD a model (with file)
router.post('/', upload, modelsController.addModel);

// UPDATE a model (with optional new file)
router.put('/:id', upload, modelsController.updateModel);

// DELETE a model
router.delete('/:id', modelsController.deleteModel);

module.exports = router;
