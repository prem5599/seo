import axios from 'axios';
import { logInfo, logError } from '../config/logger';

/**
 * Core Web Vitals Service
 * Integrates with Google PageSpeed Insights API to fetch Core Web Vitals scores
 */

export interface CoreWebVitalsData {
  // Largest Contentful Paint (LCP)
  lcp: {
    score: number;
    value: number; // milliseconds
    displayValue: string;
    category: 'good' | 'needs-improvement' | 'poor';
  };

  // Interaction to Next Paint (INP) / First Input Delay (FID)
  inp: {
    score: number;
    value: number; // milliseconds
    displayValue: string;
    category: 'good' | 'needs-improvement' | 'poor';
  };

  // Cumulative Layout Shift (CLS)
  cls: {
    score: number;
    value: number; // score
    displayValue: string;
    category: 'good' | 'needs-improvement' | 'poor';
  };

  // Overall Performance Score
  performanceScore: number; // 0-100

  // Additional Metrics
  speedIndex: number;
  timeToInteractive: number;
  totalBlockingTime: number;
}

export class CoreWebVitalsService {
  private static readonly API_URL = 'https://pagespeedonline.googleapis.com/pagespeedonline/v5/runPagespeed';
  private static readonly API_KEY = process.env.GOOGLE_PAGESPEED_API_KEY;

  /**
   * Fetch Core Web Vitals for a URL using Google PageSpeed Insights API
   */
  static async fetchCoreWebVitals(url: string, strategy: 'mobile' | 'desktop' = 'mobile'): Promise<CoreWebVitalsData | null> {
    try {
      if (!this.API_KEY) {
        logInfo('Google PageSpeed API key not configured, skipping Core Web Vitals check');
        return null;
      }

      logInfo(`Fetching Core Web Vitals for ${url} (${strategy})`);

      const response = await axios.get(this.API_URL, {
        params: {
          url,
          key: this.API_KEY,
          strategy,
          category: 'performance',
        },
        timeout: 60000, // 60 seconds
      });

      const data = response.data;
      const lighthouseResult = data.lighthouseResult;
      const audits = lighthouseResult.audits;

      // Extract Core Web Vitals metrics
      const lcp = this.extractMetric(audits['largest-contentful-paint'], 2500, 4000);
      const inp = this.extractMetric(audits['interaction-to-next-paint'] || audits['max-potential-fid'], 100, 500);
      const cls = this.extractMetric(audits['cumulative-layout-shift'], 0.1, 0.25);

      // Extract performance score
      const performanceScore = Math.round((lighthouseResult.categories.performance.score || 0) * 100);

      // Extract additional metrics
      const speedIndex = audits['speed-index']?.numericValue || 0;
      const timeToInteractive = audits['interactive']?.numericValue || 0;
      const totalBlockingTime = audits['total-blocking-time']?.numericValue || 0;

      logInfo(`Core Web Vitals fetched successfully for ${url}`);

      return {
        lcp,
        inp,
        cls,
        performanceScore,
        speedIndex,
        timeToInteractive,
        totalBlockingTime,
      };
    } catch (error: any) {
      if (error.response?.status === 400) {
        logError(`Invalid URL for PageSpeed: ${url}`, error);
      } else if (error.response?.status === 429) {
        logError(`PageSpeed API rate limit exceeded`, error);
      } else {
        logError(`Error fetching Core Web Vitals for ${url}`, error);
      }
      return null;
    }
  }

  /**
   * Extract and categorize a metric from PageSpeed audit
   */
  private static extractMetric(
    audit: any,
    goodThreshold: number,
    poorThreshold: number
  ): {
    score: number;
    value: number;
    displayValue: string;
    category: 'good' | 'needs-improvement' | 'poor';
  } {
    if (!audit) {
      return {
        score: 0,
        value: 0,
        displayValue: 'N/A',
        category: 'poor',
      };
    }

    const value = audit.numericValue || 0;
    const score = Math.round((audit.score || 0) * 100);
    const displayValue = audit.displayValue || 'N/A';

    // Determine category based on thresholds
    let category: 'good' | 'needs-improvement' | 'poor';

    // For CLS, lower is better
    if (audit.id === 'cumulative-layout-shift') {
      if (value <= goodThreshold) {
        category = 'good';
      } else if (value <= poorThreshold) {
        category = 'needs-improvement';
      } else {
        category = 'poor';
      }
    } else {
      // For LCP and INP, lower is better
      if (value < goodThreshold) {
        category = 'good';
      } else if (value < poorThreshold) {
        category = 'needs-improvement';
      } else {
        category = 'poor';
      }
    }

    return {
      score,
      value,
      displayValue,
      category,
    };
  }

  /**
   * Batch fetch Core Web Vitals for multiple URLs
   */
  static async fetchBatchCoreWebVitals(
    urls: string[],
    strategy: 'mobile' | 'desktop' = 'mobile'
  ): Promise<Map<string, CoreWebVitalsData | null>> {
    const results = new Map<string, CoreWebVitalsData | null>();

    // Fetch in sequence to avoid rate limiting (max 2 requests per second)
    for (const url of urls) {
      const vitals = await this.fetchCoreWebVitals(url, strategy);
      results.set(url, vitals);

      // Wait 500ms between requests to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    return results;
  }

  /**
   * Calculate aggregate Core Web Vitals scores for an entire site
   */
  static calculateAggregateCWV(vitalsData: CoreWebVitalsData[]): {
    avgLCP: number;
    avgINP: number;
    avgCLS: number;
    avgPerformanceScore: number;
    goodLCPPages: number;
    goodINPPages: number;
    goodCLSPages: number;
    totalPages: number;
    passRate: number; // % of pages passing all CWV
  } {
    if (vitalsData.length === 0) {
      return {
        avgLCP: 0,
        avgINP: 0,
        avgCLS: 0,
        avgPerformanceScore: 0,
        goodLCPPages: 0,
        goodINPPages: 0,
        goodCLSPages: 0,
        totalPages: 0,
        passRate: 0,
      };
    }

    const totalPages = vitalsData.length;

    const avgLCP = vitalsData.reduce((sum, v) => sum + v.lcp.value, 0) / totalPages;
    const avgINP = vitalsData.reduce((sum, v) => sum + v.inp.value, 0) / totalPages;
    const avgCLS = vitalsData.reduce((sum, v) => sum + v.cls.value, 0) / totalPages;
    const avgPerformanceScore = vitalsData.reduce((sum, v) => sum + v.performanceScore, 0) / totalPages;

    const goodLCPPages = vitalsData.filter(v => v.lcp.category === 'good').length;
    const goodINPPages = vitalsData.filter(v => v.inp.category === 'good').length;
    const goodCLSPages = vitalsData.filter(v => v.cls.category === 'good').length;

    // Page passes if all 3 Core Web Vitals are "good"
    const passingPages = vitalsData.filter(v =>
      v.lcp.category === 'good' &&
      v.inp.category === 'good' &&
      v.cls.category === 'good'
    ).length;

    const passRate = (passingPages / totalPages) * 100;

    return {
      avgLCP,
      avgINP,
      avgCLS,
      avgPerformanceScore,
      goodLCPPages,
      goodINPPages,
      goodCLSPages,
      totalPages,
      passRate,
    };
  }

  /**
   * Get performance recommendations based on Core Web Vitals
   */
  static getPerformanceRecommendations(vitals: CoreWebVitalsData): string[] {
    const recommendations: string[] = [];

    // LCP recommendations
    if (vitals.lcp.category === 'poor') {
      recommendations.push('Optimize Largest Contentful Paint (LCP): Compress images, enable lazy loading, and use a CDN');
    } else if (vitals.lcp.category === 'needs-improvement') {
      recommendations.push('Improve LCP: Consider optimizing server response times and removing render-blocking resources');
    }

    // INP recommendations
    if (vitals.inp.category === 'poor') {
      recommendations.push('Reduce Interaction to Next Paint (INP): Minimize JavaScript execution and break up long tasks');
    } else if (vitals.inp.category === 'needs-improvement') {
      recommendations.push('Improve INP: Optimize third-party scripts and defer non-critical JavaScript');
    }

    // CLS recommendations
    if (vitals.cls.category === 'poor') {
      recommendations.push('Fix Cumulative Layout Shift (CLS): Specify image dimensions, reserve space for ads, and avoid injecting content above existing content');
    } else if (vitals.cls.category === 'needs-improvement') {
      recommendations.push('Improve CLS: Use font-display: swap and ensure all images have width and height attributes');
    }

    // Overall performance
    if (vitals.performanceScore < 50) {
      recommendations.push('Overall performance is poor: Consider a complete performance audit and optimization strategy');
    } else if (vitals.performanceScore < 80) {
      recommendations.push('Performance needs improvement: Focus on optimizing Core Web Vitals and reducing page load time');
    }

    return recommendations;
  }
}
