import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { redisClient } from '../config/redis';
import { Request, Response } from 'express';

// Rate limit configuration based on subscription plans
const RATE_LIMITS = {
  starter: 30,    // 30 requests per minute
  pro: 60,        // 60 requests per minute
  agency: 120,    // 120 requests per minute
  enterprise: 300, // 300 requests per minute
  default: 20,    // 20 requests per minute for unauthenticated
};

// Create Redis store for rate limiting (optional, falls back to memory)
let store: RedisStore | undefined;

try {
  if (redisClient && redisClient.isReady) {
    store = new RedisStore({
      // @ts-ignore - rate-limit-redis expects a different interface
      sendCommand: (...args: string[]) => redisClient.sendCommand(args),
    });
  }
} catch (error) {
  console.warn('Redis store not available for rate limiting, using memory store');
}

// General API rate limiter
export const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: async (req: Request) => {
    // Get user's subscription plan from request
    const user = (req as any).user;
    if (user && user.subscription_plan) {
      return RATE_LIMITS[user.subscription_plan as keyof typeof RATE_LIMITS] || RATE_LIMITS.default;
    }
    return RATE_LIMITS.default;
  },
  message: {
    error: 'Too Many Requests',
    message: 'Rate limit exceeded. Please try again later.',
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  store: store,
  keyGenerator: (req: Request) => {
    // Use user ID if authenticated, otherwise use IP
    const user = (req as any).user;
    return user?.id || req.ip || 'unknown';
  },
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter: 60,
    });
  },
});

// Stricter rate limiter for authentication endpoints
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    error: 'Too Many Requests',
    message: 'Too many authentication attempts. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: store,
  skipSuccessfulRequests: true, // Don't count successful requests
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: 'Too Many Requests',
      message: 'Too many authentication attempts. Please try again after 15 minutes.',
      retryAfter: 900,
    });
  },
});

// Audit creation rate limiter (prevents abuse)
export const auditRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: async (req: Request) => {
    const user = (req as any).user;
    if (user && user.subscription_plan) {
      // Allow more concurrent audits for higher tiers
      const limits: Record<string, number> = {
        starter: 2,
        pro: 5,
        agency: 10,
        enterprise: 20,
      };
      return limits[user.subscription_plan] || 1;
    }
    return 1;
  },
  message: {
    error: 'Too Many Requests',
    message: 'Too many audit requests. Please wait before creating another audit.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: store,
  keyGenerator: (req: Request) => {
    const user = (req as any).user;
    return user?.id || req.ip || 'unknown';
  },
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: 'Too Many Requests',
      message: 'Too many audit requests. Please wait before creating another audit.',
      retryAfter: 60,
    });
  },
});

// Export rate limits configuration for reference
export { RATE_LIMITS };
