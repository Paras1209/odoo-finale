// ===========================================
// DealFlow360 - Request Logger Middleware
// ===========================================
// PHASE 0: Development request logging.
// ===========================================

import { Request, Response, NextFunction } from 'express';

/**
 * Simple request logger for development
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  
  // Log request
  console.log(`[${new Date().toISOString()}] --> ${req.method} ${req.originalUrl}`);
  
  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - start;
    const statusColor = res.statusCode >= 400 ? '\x1b[31m' : '\x1b[32m';
    const reset = '\x1b[0m';
    
    console.log(
      `[${new Date().toISOString()}] <-- ${req.method} ${req.originalUrl} ` +
      `${statusColor}${res.statusCode}${reset} ${duration}ms`
    );
  });
  
  next();
}
