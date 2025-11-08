import { Router } from 'express';
import * as graphController from '../controllers/graph.controller';

const router = Router();

// /api/graph
router.get('/', graphController.getGraphData);

export default router;