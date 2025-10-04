import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to handle FormData array fields
 * Converts amenities[] to amenities array
 */
export const handleFormDataArrays = (req: Request, res: Response, next: NextFunction): void => {
  // Handle amenities[] field
  if (req.body['amenities[]']) {
    req.body.amenities = Array.isArray(req.body['amenities[]'])
      ? req.body['amenities[]']
      : [req.body['amenities[]']];
    delete req.body['amenities[]'];
  }

  next();
};