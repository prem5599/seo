import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { query } from '../config/database';

export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    const result = await query(
      `SELECT id, email, subscription_plan, created_at FROM users WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
      return;
    }

    res.status(200).json({
      status: 'success',
      data: {
        user: result.rows[0]
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch profile'
    });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { email } = req.body;

    if (!email) {
      res.status(400).json({
        status: 'error',
        message: 'Email is required'
      });
      return;
    }

    const result = await query(
      `UPDATE users SET email = $1, updated_at = NOW() WHERE id = $2 RETURNING id, email, subscription_plan`,
      [email, userId]
    );

    res.status(200).json({
      status: 'success',
      data: {
        user: result.rows[0]
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update profile'
    });
  }
};

export const getSubscription = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    const result = await query(
      `SELECT * FROM subscriptions WHERE user_id = $1`,
      [userId]
    );

    res.status(200).json({
      status: 'success',
      data: {
        subscription: result.rows[0] || null
      }
    });
  } catch (error) {
    console.error('Get subscription error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch subscription'
    });
  }
};

export const upgradeSubscription = async (req: AuthRequest, res: Response): Promise<void> => {
  res.status(200).json({
    status: 'success',
    message: 'Upgrade subscription endpoint - to be implemented with Stripe'
  });
};

export const cancelSubscription = async (req: AuthRequest, res: Response): Promise<void> => {
  res.status(200).json({
    status: 'success',
    message: 'Cancel subscription endpoint - to be implemented with Stripe'
  });
};
