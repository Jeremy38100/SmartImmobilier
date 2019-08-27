import { Router } from 'express';
import UserRouter from './Users';
import TopographyRouter from './Topography';

// Init router and path
const router = Router();

// Add sub-routes
router.use('/users', UserRouter);
router.use('/topography', TopographyRouter);

// Export the base-router
export default router;
