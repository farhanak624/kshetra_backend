// @ts-nocheck
import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { verifyToken, extractTokenFromHeader, JWTPayload } from '../utils/jwt';
import { User } from '../models';

export interface AuthenticatedRequest extends Request {
  user?: {
    _id: string;
    userId: string;
    email: string;
    role: string;
  };
}

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Access token is required'
      });
      return;
    }

    const decoded = verifyToken(token);

    // Handle hardcoded admin user
    if (decoded.userId === 'admin_id_123') {
      // Create a consistent ObjectId for the hardcoded admin
      const adminObjectId = new Types.ObjectId('507f1f77bcf86cd799439011');
      req.user = {
        _id: adminObjectId.toString(),
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role
      };
    } else {
      // Verify user still exists in database for regular users
      const user = await User.findById(decoded.userId).select('_id email role');
      if (!user) {
        res.status(401).json({
          success: false,
          message: 'User no longer exists'
        });
        return;
      }

      req.user = {
        _id: (user._id as any).toString(),
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role
      };
    }

    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
      return;
    }

    next();
  };
};