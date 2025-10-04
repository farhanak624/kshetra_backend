import { Response, NextFunction } from 'express';
import { authenticate, authorize, AuthenticatedRequest } from './auth';

export const adminAuth = [
  authenticate,
  authorize('admin')
];

export const requireAdminAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await authenticate(req, res, () => {
      authorize('admin')(req, res, next);
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Admin authentication required'
    });
  }
};