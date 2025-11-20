import { pool } from '../config/database';
import { logInfo, logError } from '../config/logger';

/**
 * Health Score Calculator Service
 * Implements the comprehensive health score algorithm:
 * - Critical Issues: 40% weight
 * - Warning Issues: 30% weight
 * - Notice Issues: 20% weight
 * - Performance Score: 10% weight
 */

export interface HealthScoreBreakdown {
  overallScore: number; // 0-100
  criticalScore: number; // 0-100
  warningScore: number; // 0-100
  noticeScore: number; // 0-100
  performanceScore: number; // 0-100
  breakdown: {
    critical: { weight: number; score: number; contribution: number };
    warnings: { weight: number; score: number; contribution: number };
    notices: { weight: number; score: number; contribution: number };
    performance: { weight: number; score: number; contribution: number };
  };
  grade: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  interpretation: string;
  actionRequired: string;
}

export class HealthScoreService {
  /**
   * Calculate comprehensive health score for an audit
   */
  static async calculateHealthScore(auditId: string): Promise<HealthScoreBreakdown> {
    try {
      // Fetch audit data
      const auditResult = await pool.query(
        `SELECT critical_issues_count, warnings_count, notices_count,
                performance_score, total_pages_crawled
         FROM audits WHERE id = $1`,
        [auditId]
      );

      if (auditResult.rows.length === 0) {
        throw new Error('Audit not found');
      }

      const audit = auditResult.rows[0];

      // Calculate individual component scores
      const criticalScore = this.calculateCriticalScore(
        audit.critical_issues_count,
        audit.total_pages_crawled
      );

      const warningScore = this.calculateWarningScore(
        audit.warnings_count,
        audit.total_pages_crawled
      );

      const noticeScore = this.calculateNoticeScore(
        audit.notices_count,
        audit.total_pages_crawled
      );

      const performanceScore = audit.performance_score || 0;

      // Calculate weighted overall score
      const weights = {
        critical: 0.40, // 40%
        warnings: 0.30, // 30%
        notices: 0.20,  // 20%
        performance: 0.10, // 10%
      };

      const criticalContribution = criticalScore * weights.critical;
      const warningContribution = warningScore * weights.warnings;
      const noticeContribution = noticeScore * weights.notices;
      const performanceContribution = performanceScore * weights.performance;

      const overallScore = Math.round(
        criticalContribution +
        warningContribution +
        noticeContribution +
        performanceContribution
      );

      // Determine grade and interpretation
      const { grade, interpretation, actionRequired } = this.getScoreInterpretation(overallScore);

      // Update audit with calculated score
      await pool.query(
        'UPDATE audits SET health_score = $1, updated_at = NOW() WHERE id = $2',
        [overallScore, auditId]
      );

      logInfo(`Health score calculated for audit ${auditId}: ${overallScore}`);

      return {
        overallScore,
        criticalScore,
        warningScore,
        noticeScore,
        performanceScore,
        breakdown: {
          critical: {
            weight: weights.critical * 100,
            score: criticalScore,
            contribution: criticalContribution,
          },
          warnings: {
            weight: weights.warnings * 100,
            score: warningScore,
            contribution: warningContribution,
          },
          notices: {
            weight: weights.notices * 100,
            score: noticeScore,
            contribution: noticeContribution,
          },
          performance: {
            weight: weights.performance * 100,
            score: performanceScore,
            contribution: performanceContribution,
          },
        },
        grade,
        interpretation,
        actionRequired,
      };
    } catch (error) {
      logError('Error calculating health score', error);
      throw error;
    }
  }

  /**
   * Calculate critical issues score (0-100)
   * Critical issues have severe impact - each issue reduces score significantly
   */
  private static calculateCriticalScore(criticalCount: number, totalPages: number): number {
    if (totalPages === 0) return 100;

    // Critical issues are very impactful
    // Formula: Start at 100, deduct 10 points per critical issue (proportional to pages)
    const issueRatio = criticalCount / totalPages;

    let score = 100;

    if (issueRatio > 0) {
      // Severe penalty for critical issues
      if (issueRatio >= 0.5) {
        // 50%+ of pages have critical issues
        score = 0;
      } else if (issueRatio >= 0.25) {
        // 25-50% of pages
        score = 25;
      } else if (issueRatio >= 0.10) {
        // 10-25% of pages
        score = 50;
      } else if (issueRatio >= 0.05) {
        // 5-10% of pages
        score = 70;
      } else {
        // < 5% of pages
        score = 85;
      }
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate warnings score (0-100)
   * Warnings are medium impact
   */
  private static calculateWarningScore(warningsCount: number, totalPages: number): number {
    if (totalPages === 0) return 100;

    const issueRatio = warningsCount / totalPages;

    let score = 100;

    if (issueRatio > 0) {
      // Medium penalty for warnings
      if (issueRatio >= 0.5) {
        score = 30;
      } else if (issueRatio >= 0.25) {
        score = 50;
      } else if (issueRatio >= 0.10) {
        score = 70;
      } else if (issueRatio >= 0.05) {
        score = 85;
      } else {
        score = 95;
      }
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate notices score (0-100)
   * Notices are minor issues - less impactful
   */
  private static calculateNoticeScore(noticesCount: number, totalPages: number): number {
    if (totalPages === 0) return 100;

    const issueRatio = noticesCount / totalPages;

    let score = 100;

    if (issueRatio > 0) {
      // Minor penalty for notices
      if (issueRatio >= 0.75) {
        score = 50;
      } else if (issueRatio >= 0.50) {
        score = 70;
      } else if (issueRatio >= 0.25) {
        score = 85;
      } else {
        score = 95;
      }
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Get grade, interpretation, and action based on score
   */
  private static getScoreInterpretation(score: number): {
    grade: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
    interpretation: string;
    actionRequired: string;
  } {
    if (score >= 90) {
      return {
        grade: 'excellent',
        interpretation: 'Site is well-optimized with minimal issues. Excellent SEO health.',
        actionRequired: 'Maintain current optimization and continue monitoring. Focus on content quality and link building.',
      };
    } else if (score >= 75) {
      return {
        grade: 'good',
        interpretation: 'Site is in good shape with minor issues to address. Good SEO health overall.',
        actionRequired: 'Plan improvements for identified issues. Prioritize critical and warning issues first.',
      };
    } else if (score >= 50) {
      return {
        grade: 'fair',
        interpretation: 'Site has multiple issues affecting rankings. Fair SEO health needs attention.',
        actionRequired: 'Prioritize fixes for critical issues immediately. Schedule time to address warnings within 1-2 weeks.',
      };
    } else if (score >= 25) {
      return {
        grade: 'poor',
        interpretation: 'Site has significant problems impacting search visibility. Poor SEO health.',
        actionRequired: 'Urgent action needed. Fix all critical issues within 48 hours. Address warnings within 1 week.',
      };
    } else {
      return {
        grade: 'critical',
        interpretation: 'Site has severe issues preventing proper indexing and ranking. Critical SEO health.',
        actionRequired: 'IMMEDIATE ACTION REQUIRED. Fix critical issues TODAY. Site may not be indexable or rankable.',
      };
    }
  }

  /**
   * Get estimated traffic impact of fixing issues
   */
  static estimateTrafficImpact(healthScore: HealthScoreBreakdown): {
    currentTrafficPotential: number; // Percentage
    potentialGain: number; // Percentage
    estimatedImprovement: string;
  } {
    const currentPotential = healthScore.overallScore;
    const potentialGain = 100 - currentPotential;

    let estimatedImprovement = '';

    if (potentialGain >= 50) {
      estimatedImprovement = `Fixing all issues could increase organic traffic by 50-100%+`;
    } else if (potentialGain >= 30) {
      estimatedImprovement = `Fixing all issues could increase organic traffic by 30-50%`;
    } else if (potentialGain >= 15) {
      estimatedImprovement = `Fixing all issues could increase organic traffic by 15-30%`;
    } else if (potentialGain >= 5) {
      estimatedImprovement = `Fixing remaining issues could increase organic traffic by 5-15%`;
    } else {
      estimatedImprovement = `Site is well-optimized. Continue monitoring and maintenance.`;
    }

    return {
      currentTrafficPotential: currentPotential,
      potentialGain,
      estimatedImprovement,
    };
  }

  /**
   * Get time estimates for fixes
   */
  static getFixTimeEstimates(
    criticalCount: number,
    warningsCount: number,
    noticesCount: number
  ): {
    criticalFixTime: string;
    warningsFixTime: string;
    noticesFixTime: string;
    totalTime: string;
  } {
    // Rough estimates (in hours)
    const criticalHours = criticalCount * 2; // 2 hours per critical issue avg
    const warningHours = warningsCount * 1; // 1 hour per warning avg
    const noticeHours = noticesCount * 0.5; // 30 min per notice avg

    const totalHours = criticalHours + warningHours + noticeHours;

    const formatTime = (hours: number): string => {
      if (hours < 1) return `${Math.round(hours * 60)} minutes`;
      if (hours < 8) return `${Math.round(hours)} hours`;
      const days = Math.round(hours / 8);
      return `${days} ${days === 1 ? 'day' : 'days'}`;
    };

    return {
      criticalFixTime: formatTime(criticalHours),
      warningsFixTime: formatTime(warningHours),
      noticesFixTime: formatTime(noticeHours),
      totalTime: formatTime(totalHours),
    };
  }

  /**
   * Get prioritized issue categories
   */
  static async getPrioritizedIssues(auditId: string): Promise<Array<{
    category: string;
    count: number;
    severity: string;
    priority: number;
  }>> {
    try {
      const result = await pool.query(
        `SELECT issue_type, severity, COUNT(*) as count
         FROM issues
         WHERE audit_id = $1
         GROUP BY issue_type, severity
         ORDER BY
           CASE severity
             WHEN 'critical' THEN 1
             WHEN 'warning' THEN 2
             WHEN 'notice' THEN 3
           END,
           count DESC`,
        [auditId]
      );

      return result.rows.map((row, index) => ({
        category: row.issue_type,
        count: parseInt(row.count),
        severity: row.severity,
        priority: index + 1,
      }));
    } catch (error) {
      logError('Error getting prioritized issues', error);
      return [];
    }
  }
}
