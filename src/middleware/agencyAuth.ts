// @ts-nocheck
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Agency } from '../models';
import { IAgency } from '../models/Agency';

export interface AgencyAuthRequest extends Request {
  agency?: IAgency;
}

export const agencyAuth = async (req: AgencyAuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        success: false,
        message: 'JWT secret not configured'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET) as any;

    // Check if this is an agency token
    if (decoded.type !== 'agency') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token type'
      });
    }

    const agency = await Agency.findById(decoded.agencyId).select('+password');
    if (!agency) {
      return res.status(401).json({
        success: false,
        message: 'Agency not found'
      });
    }

    // Check if agency is active
    if (!agency.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Agency account is deactivated'
      });
    }

    req.agency = agency;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    console.error('Agency auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during authentication'
    });
  }
};

export const optionalAgencyAuth = async (req: AgencyAuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return next();
    }

    if (!process.env.JWT_SECRET) {
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET) as any;

    if (decoded.type === 'agency') {
      const agency = await Agency.findById(decoded.agencyId);
      if (agency && agency.isActive) {
        req.agency = agency;
      }
    }

    next();
  } catch (error) {
    // Continue without authentication for optional auth
    next();
  }
};