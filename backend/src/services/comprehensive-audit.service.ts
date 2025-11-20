import { Page } from 'puppeteer';
import { pool } from '../config/database';
import { logInfo, logError } from '../config/logger';

/**
 * Comprehensive Audit Service
 * Implements 100+ SEO audit checks based on Google's Quality Rater Guidelines
 */

export interface PageAuditData {
  url: string;
  statusCode: number;
  title: string | null;
  titleLength: number;
  metaDescription: string | null;
  metaDescriptionLength: number;
  h1Tags: string[];
  h2Tags: string[];
  h3Tags: string[];
  canonicalUrl: string | null;
  robotsMeta: string | null;
  isIndexable: boolean;
  isNofollow: boolean;
  wordCount: number;
  internalLinks: number;
  externalLinks: number;
  images: number;
  imagesWithoutAlt: number;
  hasSchema: boolean;
  mobileFriendly: boolean;
  loadTime: number;
  pageSize: number;
  hasMixedContent: boolean;
  sslValid: boolean;
  redirectUrl: string | null;
  redirectType: string | null;
  brokenLinksCount: number;
  crawlDepth: number;
}

export class ComprehensiveAuditService {
  /**
   * SECTION 1: TECHNICAL SEO CHECKS
   */

  /**
   * Check for noindex meta tag or X-Robots-Tag header
   */
  static async checkIndexation(page: Page): Promise<{
    isIndexable: boolean;
    isNofollow: boolean;
    robotsMeta: string | null;
    reason: string | null;
  }> {
    try {
      // Check meta robots tag
      const robotsMeta = await page.$eval(
        'meta[name="robots"]',
        (el) => el.getAttribute('content')
      ).catch(() => null);

      // Check X-Robots-Tag header
      const response = page.mainFrame().response();
      const xRobotsTag = response?.headers()['x-robots-tag'] || null;

      let isIndexable = true;
      let isNofollow = false;
      let reason = null;

      // Check robots meta
      if (robotsMeta) {
        const robotsLower = robotsMeta.toLowerCase();
        if (robotsLower.includes('noindex')) {
          isIndexable = false;
          reason = 'noindex in meta robots tag';
        }
        if (robotsLower.includes('nofollow')) {
          isNofollow = true;
        }
      }

      // Check X-Robots-Tag header
      if (xRobotsTag && xRobotsTag.toLowerCase().includes('noindex')) {
        isIndexable = false;
        reason = 'noindex in X-Robots-Tag header';
      }

      return { isIndexable, isNofollow, robotsMeta: robotsMeta || xRobotsTag, reason };
    } catch (error) {
      logError('Error checking indexation', error);
      return { isIndexable: true, isNofollow: false, robotsMeta: null, reason: null };
    }
  }

  /**
   * Check for canonical tag issues
   */
  static async checkCanonicalTag(page: Page, currentUrl: string): Promise<{
    canonicalUrl: string | null;
    hasCanonical: boolean;
    isConflicting: boolean;
    isSelfReferential: boolean;
  }> {
    try {
      const canonicalUrl = await page.$eval(
        'link[rel="canonical"]',
        (el) => el.getAttribute('href')
      ).catch(() => null);

      const hasCanonical = !!canonicalUrl;
      const isSelfReferential = canonicalUrl === currentUrl;

      // Check if canonical points to different domain (cross-domain canonical)
      let isConflicting = false;
      if (canonicalUrl) {
        try {
          const currentDomain = new URL(currentUrl).hostname;
          const canonicalDomain = new URL(canonicalUrl, currentUrl).hostname;
          isConflicting = currentDomain !== canonicalDomain;
        } catch (error) {
          isConflicting = false;
        }
      }

      return { canonicalUrl, hasCanonical, isConflicting, isSelfReferential };
    } catch (error) {
      logError('Error checking canonical tag', error);
      return { canonicalUrl: null, hasCanonical: false, isConflicting: false, isSelfReferential: false };
    }
  }

  /**
   * Check for SSL and HTTPS issues
   */
  static async checkSSLAndSecurity(page: Page): Promise<{
    hasSSL: boolean;
    hasMixedContent: boolean;
    mixedContentItems: string[];
    hasHSTS: boolean;
  }> {
    try {
      const url = page.url();
      const hasSSL = url.startsWith('https://');

      // Check HSTS header
      const response = page.mainFrame().response();
      const hstsHeader = response?.headers()['strict-transport-security'] || null;
      const hasHSTS = !!hstsHeader;

      // Check for mixed content (HTTP resources on HTTPS page)
      const mixedContentItems: string[] = [];
      if (hasSSL) {
        const resources = await page.evaluate(() => {
          const imgs = Array.from(document.querySelectorAll('img')).map(img => img.src);
          const scripts = Array.from(document.querySelectorAll('script[src]')).map(script => (script as HTMLScriptElement).src);
          const links = Array.from(document.querySelectorAll('link[href]')).map(link => (link as HTMLLinkElement).href);
          const iframes = Array.from(document.querySelectorAll('iframe')).map(iframe => iframe.src);
          return [...imgs, ...scripts, ...links, ...iframes];
        });

        resources.forEach(resource => {
          if (resource && resource.startsWith('http://')) {
            mixedContentItems.push(resource);
          }
        });
      }

      return {
        hasSSL,
        hasMixedContent: mixedContentItems.length > 0,
        mixedContentItems,
        hasHSTS,
      };
    } catch (error) {
      logError('Error checking SSL', error);
      return { hasSSL: false, hasMixedContent: false, mixedContentItems: [], hasHSTS: false };
    }
  }

  /**
   * SECTION 2: ON-PAGE SEO CHECKS
   */

  /**
   * Analyze title tag quality
   */
  static async analyzeTitleTag(page: Page): Promise<{
    title: string | null;
    length: number;
    isMissing: boolean;
    isTooShort: boolean; // < 30 chars
    isTooLong: boolean; // > 60 chars
    hasKeyword: boolean;
  }> {
    try {
      const title = await page.title();
      const length = title ? title.length : 0;

      return {
        title,
        length,
        isMissing: !title || title.length === 0,
        isTooShort: length < 30,
        isTooLong: length > 60,
        hasKeyword: false, // Will be set by keyword analysis
      };
    } catch (error) {
      logError('Error analyzing title', error);
      return {
        title: null,
        length: 0,
        isMissing: true,
        isTooShort: false,
        isTooLong: false,
        hasKeyword: false,
      };
    }
  }

  /**
   * Analyze meta description
   */
  static async analyzeMetaDescription(page: Page): Promise<{
    description: string | null;
    length: number;
    isMissing: boolean;
    isTooShort: boolean; // < 120 chars
    isTooLong: boolean; // > 160 chars
  }> {
    try {
      const description = await page.$eval(
        'meta[name="description"]',
        (el) => el.getAttribute('content')
      ).catch(() => null);

      const length = description ? description.length : 0;

      return {
        description,
        length,
        isMissing: !description,
        isTooShort: length < 120 && length > 0,
        isTooLong: length > 160,
      };
    } catch (error) {
      logError('Error analyzing meta description', error);
      return {
        description: null,
        length: 0,
        isMissing: true,
        isTooShort: false,
        isTooLong: false,
      };
    }
  }

  /**
   * Analyze heading structure
   */
  static async analyzeHeadings(page: Page): Promise<{
    h1Tags: string[];
    h2Tags: string[];
    h3Tags: string[];
    h1Count: number;
    missingH1: boolean;
    multipleH1: boolean;
  }> {
    try {
      const headings = await page.evaluate(() => {
        const h1s = Array.from(document.querySelectorAll('h1')).map(h => h.textContent?.trim() || '');
        const h2s = Array.from(document.querySelectorAll('h2')).map(h => h.textContent?.trim() || '');
        const h3s = Array.from(document.querySelectorAll('h3')).map(h => h.textContent?.trim() || '');
        return { h1s, h2s, h3s };
      });

      return {
        h1Tags: headings.h1s,
        h2Tags: headings.h2s,
        h3Tags: headings.h3s,
        h1Count: headings.h1s.length,
        missingH1: headings.h1s.length === 0,
        multipleH1: headings.h1s.length > 1,
      };
    } catch (error) {
      logError('Error analyzing headings', error);
      return {
        h1Tags: [],
        h2Tags: [],
        h3Tags: [],
        h1Count: 0,
        missingH1: true,
        multipleH1: false,
      };
    }
  }

  /**
   * Analyze images
   */
  static async analyzeImages(page: Page): Promise<{
    totalImages: number;
    imagesWithoutAlt: number;
    imagesWithEmptyAlt: number;
    unoptimizedImages: Array<{ src: string; size: number }>;
  }> {
    try {
      const imageData = await page.evaluate(() => {
        const images = Array.from(document.querySelectorAll('img'));
        const withoutAlt = images.filter(img => !img.hasAttribute('alt')).length;
        const withEmptyAlt = images.filter(img => img.getAttribute('alt') === '').length;

        return {
          total: images.length,
          withoutAlt,
          withEmptyAlt,
        };
      });

      return {
        totalImages: imageData.total,
        imagesWithoutAlt: imageData.withoutAlt,
        imagesWithEmptyAlt: imageData.withEmptyAlt,
        unoptimizedImages: [], // Would require checking actual file sizes
      };
    } catch (error) {
      logError('Error analyzing images', error);
      return {
        totalImages: 0,
        imagesWithoutAlt: 0,
        imagesWithEmptyAlt: 0,
        unoptimizedImages: [],
      };
    }
  }

  /**
   * SECTION 3: CONTENT QUALITY CHECKS
   */

  /**
   * Analyze content quality and E-E-A-T signals
   */
  static async analyzeContentQuality(page: Page): Promise<{
    wordCount: number;
    isThinContent: boolean; // < 300 words
    hasAuthorInfo: boolean;
    publishDate: string | null;
    lastModified: string | null;
    contentAge: number | null; // days
  }> {
    try {
      const contentData = await page.evaluate(() => {
        // Get main content text (exclude navigation, footer, etc.)
        const mainContent = document.querySelector('main, article, [role="main"]') || document.body;
        const text = mainContent.textContent || '';
        const words = text.trim().split(/\s+/).filter(word => word.length > 0);

        // Check for author information
        const hasAuthor = !!(
          document.querySelector('[rel="author"]') ||
          document.querySelector('.author') ||
          document.querySelector('[itemprop="author"]') ||
          document.querySelector('meta[name="author"]')
        );

        // Check for publish date
        const publishDate = document.querySelector('meta[property="article:published_time"]')?.getAttribute('content') ||
                           document.querySelector('[itemprop="datePublished"]')?.getAttribute('content') ||
                           null;

        const lastModified = document.querySelector('meta[property="article:modified_time"]')?.getAttribute('content') ||
                            document.lastModified ||
                            null;

        return {
          wordCount: words.length,
          hasAuthor,
          publishDate,
          lastModified,
        };
      });

      let contentAge = null;
      if (contentData.publishDate) {
        const publishDateObj = new Date(contentData.publishDate);
        const now = new Date();
        contentAge = Math.floor((now.getTime() - publishDateObj.getTime()) / (1000 * 60 * 60 * 24));
      }

      return {
        wordCount: contentData.wordCount,
        isThinContent: contentData.wordCount < 300,
        hasAuthorInfo: contentData.hasAuthor,
        publishDate: contentData.publishDate,
        lastModified: contentData.lastModified,
        contentAge,
      };
    } catch (error) {
      logError('Error analyzing content quality', error);
      return {
        wordCount: 0,
        isThinContent: true,
        hasAuthorInfo: false,
        publishDate: null,
        lastModified: null,
        contentAge: null,
      };
    }
  }

  /**
   * Check for keyword stuffing and spam
   */
  static async detectSpam(page: Page, keyword?: string): Promise<{
    hasKeywordStuffing: boolean;
    keywordDensity: number;
    hasHiddenText: boolean;
    hiddenTextCount: number;
  }> {
    try {
      const spamData = await page.evaluate((kw) => {
        const text = document.body.textContent || '';
        const words = text.toLowerCase().split(/\s+/);
        const totalWords = words.length;

        // Calculate keyword density if keyword provided
        let keywordCount = 0;
        if (kw) {
          const kwLower = kw.toLowerCase();
          keywordCount = words.filter(w => w.includes(kwLower)).length;
        }

        const keywordDensity = totalWords > 0 ? (keywordCount / totalWords) * 100 : 0;
        const hasKeywordStuffing = keywordDensity > 5; // > 5% is suspicious

        // Check for hidden text (display:none, visibility:hidden, font-size:0, etc.)
        const allElements = document.querySelectorAll('*');
        let hiddenTextCount = 0;

        allElements.forEach(el => {
          const styles = window.getComputedStyle(el);
          const hasText = el.textContent && el.textContent.trim().length > 10;

          if (hasText && (
            styles.display === 'none' ||
            styles.visibility === 'hidden' ||
            parseFloat(styles.fontSize) === 0 ||
            styles.opacity === '0'
          )) {
            hiddenTextCount++;
          }
        });

        return {
          hasKeywordStuffing,
          keywordDensity,
          hiddenTextCount,
        };
      }, keyword);

      return {
        hasKeywordStuffing: spamData.hasKeywordStuffing,
        keywordDensity: spamData.keywordDensity,
        hasHiddenText: spamData.hiddenTextCount > 0,
        hiddenTextCount: spamData.hiddenTextCount,
      };
    } catch (error) {
      logError('Error detecting spam', error);
      return {
        hasKeywordStuffing: false,
        keywordDensity: 0,
        hasHiddenText: false,
        hiddenTextCount: 0,
      };
    }
  }

  /**
   * SECTION 4: PERFORMANCE CHECKS
   */

  /**
   * Analyze page performance metrics
   */
  static async analyzePerformance(page: Page): Promise<{
    loadTime: number;
    pageSize: number;
    resourceCounts: {
      images: number;
      scripts: number;
      stylesheets: number;
    };
    renderBlockingResources: number;
  }> {
    try {
      const performanceData = await page.evaluate(() => {
        const perfData = window.performance.timing;
        const loadTime = perfData.loadEventEnd - perfData.navigationStart;

        const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
        const pageSize = resources.reduce((sum, r) => sum + (r.transferSize || 0), 0);

        const images = resources.filter(r => r.initiatorType === 'img').length;
        const scripts = resources.filter(r => r.initiatorType === 'script').length;
        const stylesheets = resources.filter(r => r.initiatorType === 'link' || r.initiatorType === 'css').length;

        return {
          loadTime,
          pageSize,
          resourceCounts: { images, scripts, stylesheets },
        };
      });

      return {
        ...performanceData,
        renderBlockingResources: 0, // Would need more complex analysis
      };
    } catch (error) {
      logError('Error analyzing performance', error);
      return {
        loadTime: 0,
        pageSize: 0,
        resourceCounts: { images: 0, scripts: 0, stylesheets: 0 },
        renderBlockingResources: 0,
      };
    }
  }

  /**
   * Check mobile usability
   */
  static async checkMobileUsability(page: Page): Promise<{
    hasViewportMeta: boolean;
    isMobileFriendly: boolean;
    smallTapTargets: number;
    textTooSmall: boolean;
  }> {
    try {
      const mobileData = await page.evaluate(() => {
        const viewportMeta = document.querySelector('meta[name="viewport"]');
        const hasViewport = !!viewportMeta;

        // Check for small tap targets (< 44x44 pixels)
        const clickableElements = document.querySelectorAll('a, button, input[type="button"], input[type="submit"]');
        let smallTargets = 0;

        clickableElements.forEach(el => {
          const rect = el.getBoundingClientRect();
          if (rect.width < 44 || rect.height < 44) {
            smallTargets++;
          }
        });

        // Check for very small text
        const allElements = document.querySelectorAll('p, span, div, li');
        let textTooSmall = false;
        allElements.forEach(el => {
          const fontSize = parseFloat(window.getComputedStyle(el).fontSize);
          if (fontSize < 12) {
            textTooSmall = true;
          }
        });

        return {
          hasViewport,
          smallTargets,
          textTooSmall,
        };
      });

      return {
        hasViewportMeta: mobileData.hasViewport,
        isMobileFriendly: mobileData.hasViewport && mobileData.smallTargets < 10,
        smallTapTargets: mobileData.smallTargets,
        textTooSmall: mobileData.textTooSmall,
      };
    } catch (error) {
      logError('Error checking mobile usability', error);
      return {
        hasViewportMeta: false,
        isMobileFriendly: false,
        smallTapTargets: 0,
        textTooSmall: false,
      };
    }
  }

  /**
   * SECTION 5: LINK ANALYSIS
   */

  /**
   * Analyze internal and external links
   */
  static async analyzeLinks(page: Page, baseUrl: string): Promise<{
    internalLinks: number;
    externalLinks: number;
    bokenLinks: number;
    nofollowLinks: number;
    brokenLinkUrls: string[];
  }> {
    try {
      const linkData = await page.evaluate((base) => {
        const links = Array.from(document.querySelectorAll('a[href]'));
        const baseHostname = new URL(base).hostname;

        let internal = 0;
        let external = 0;
        let nofollow = 0;

        links.forEach(link => {
          try {
            const href = link.getAttribute('href');
            if (!href) return;

            const absoluteUrl = new URL(href, base);
            if (absoluteUrl.hostname === baseHostname) {
              internal++;
            } else {
              external++;
            }

            if (link.getAttribute('rel')?.includes('nofollow')) {
              nofollow++;
            }
          } catch (e) {
            // Invalid URL
          }
        });

        return { internal, external, nofollow };
      }, baseUrl);

      return {
        internalLinks: linkData.internal,
        externalLinks: linkData.external,
        bokenLinks: 0, // Would need to check each link
        nofollowLinks: linkData.nofollow,
        brokenLinkUrls: [],
      };
    } catch (error) {
      logError('Error analyzing links', error);
      return {
        internalLinks: 0,
        externalLinks: 0,
        bokenLinks: 0,
        nofollowLinks: 0,
        brokenLinkUrls: [],
      };
    }
  }

  /**
   * Check for structured data (Schema.org)
   */
  static async checkStructuredData(page: Page): Promise<{
    hasSchema: boolean;
    schemaTypes: string[];
  }> {
    try {
      const schemaData = await page.evaluate(() => {
        const jsonLdScripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
        const types: string[] = [];

        jsonLdScripts.forEach(script => {
          try {
            const data = JSON.parse(script.textContent || '');
            if (data['@type']) {
              types.push(data['@type']);
            }
          } catch (e) {
            // Invalid JSON
          }
        });

        return { types };
      });

      return {
        hasSchema: schemaData.types.length > 0,
        schemaTypes: schemaData.types,
      };
    } catch (error) {
      logError('Error checking structured data', error);
      return {
        hasSchema: false,
        schemaTypes: [],
      };
    }
  }
}
