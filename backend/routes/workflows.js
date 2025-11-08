const express = require('express');
const router = express.Router();
const controller = require('../controllers/workflowController');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

router.get('/', controller.list);
router.post('/', controller.create);
router.get('/:id', controller.get);
router.put('/:id', controller.update);
router.delete('/:id', controller.remove);
router.patch('/:id/activate', controller.activate);
router.patch('/:id/deactivate', controller.deactivate);
router.post('/:id/duplicate', controller.duplicate);

module.exports = router;
