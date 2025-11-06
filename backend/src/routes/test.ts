import { Router, Request, Response, NextFunction } from 'express';
import { testService } from '../services/testService';
import { validateRequest, validateQuery } from '../middleware/validateRequest';
import { createTestSchema, listTestsQuerySchema } from '../utils/validation';
import { NotFoundError } from '../middleware/errorHandler';

const router = Router();

// POST /api/test - Create new test
router.post(
  '/test',
  validateRequest(createTestSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const test = await testService.createTest(req.body);

      res.status(201).json({
        testId: test.id,
        status: test.status,
        message: 'Test created successfully and queued for execution',
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/test/:id - Get test by ID
router.get(
  '/test/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const test = await testService.getTestById(req.params.id);

      if (!test) {
        throw new NotFoundError(`Test with ID ${req.params.id} not found`);
      }

      res.json({
        test: {
          ...test,
          scoreComponents: {
            visual: test.scoreVisual,
            stability: test.scoreStability,
            interaction: test.scoreInteraction,
            load: test.scoreLoad,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/tests - List all tests with pagination
router.get(
  '/tests',
  validateQuery(listTestsQuerySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { page, limit, status } = req.query as any;
      const result = await testService.listTests(page, limit, status);

      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/statistics - Get test statistics
router.get(
  '/statistics',
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const stats = await testService.getStatistics();
      res.json(stats);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
