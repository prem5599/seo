import puppeteer, { Browser, Page } from 'puppeteer';
import axios from 'axios';

export interface CrawlResult {
  url: string;
  statusCode: number;
  title: string;
  metaDescription: string;
  h1Tags: string[];
  h2Tags: string[];
  wordCount: number;
  loadTime: number;
  mobileFriendly: boolean;
  hasSchema: boolean;
  internalLinks: string[];
  externalLinks: string[];
  images: ImageInfo[];
  issues: SEOIssue[];
}

interface ImageInfo {
  src: string;
  alt: string;
  hasAlt: boolean;
}

interface SEOIssue {
  type: string;
  severity: 'critical' | 'warning' | 'notice';
  title: string;
  description: string;
  affectedPages: string[];
}

export class CrawlerService {
  private browser: Browser | null = null;

  async initialize(): Promise<void> {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu'
        ]
      });
    }
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  async crawlPage(url: string): Promise<CrawlResult> {
    await this.initialize();
    const page = await this.browser!.newPage();
    const startTime = Date.now();

    try {
      // Set viewport for mobile testing
      await page.setViewport({ width: 1920, height: 1080 });

      // Navigate to page
      const response = await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      const loadTime = Date.now() - startTime;
      const statusCode = response?.status() || 0;

      // Extract page data
      const pageData = await page.evaluate(() => {
        // Title
        const title = document.title || '';

        // Meta description
        const metaDesc = document.querySelector('meta[name="description"]');
        const metaDescription = metaDesc?.getAttribute('content') || '';

        // Headings
        const h1Elements = Array.from(document.querySelectorAll('h1'));
        const h1Tags = h1Elements.map(h => h.textContent?.trim() || '');

        const h2Elements = Array.from(document.querySelectorAll('h2'));
        const h2Tags = h2Elements.map(h => h.textContent?.trim() || '');

        // Word count
        const bodyText = document.body.innerText || '';
        const wordCount = bodyText.split(/\s+/).filter(word => word.length > 0).length;

        // Schema markup
        const schemaScripts = document.querySelectorAll('script[type="application/ld+json"]');
        const hasSchema = schemaScripts.length > 0;

        // Links
        const links = Array.from(document.querySelectorAll('a[href]'));
        const currentDomain = window.location.hostname;
        const internalLinks: string[] = [];
        const externalLinks: string[] = [];

        links.forEach(link => {
          const href = link.getAttribute('href');
          if (href) {
            try {
              const linkUrl = new URL(href, window.location.href);
              if (linkUrl.hostname === currentDomain) {
                internalLinks.push(linkUrl.href);
              } else {
                externalLinks.push(linkUrl.href);
              }
            } catch (e) {
              // Invalid URL, skip
            }
          }
        });

        // Images
        const imgElements = Array.from(document.querySelectorAll('img'));
        const images = imgElements.map(img => ({
          src: img.src,
          alt: img.alt || '',
          hasAlt: Boolean(img.alt)
        }));

        return {
          title,
          metaDescription,
          h1Tags,
          h2Tags,
          wordCount,
          hasSchema,
          internalLinks,
          externalLinks,
          images
        };
      });

      // Check mobile friendliness
      await page.setViewport({ width: 375, height: 667 });
      await page.waitForTimeout(1000);
      const mobileFriendly = await this.checkMobileFriendly(page);

      // Analyze for issues
      const issues = this.analyzeIssues({
        ...pageData,
        statusCode,
        url,
        loadTime,
        mobileFriendly
      });

      await page.close();

      return {
        url,
        statusCode,
        ...pageData,
        loadTime,
        mobileFriendly,
        issues
      };
    } catch (error) {
      await page.close();
      throw error;
    }
  }

  private async checkMobileFriendly(page: Page): Promise<boolean> {
    try {
      const viewport = await page.evaluate(() => {
        const metaViewport = document.querySelector('meta[name="viewport"]');
        return metaViewport?.getAttribute('content') || '';
      });

      return viewport.includes('width=device-width');
    } catch {
      return false;
    }
  }

  private analyzeIssues(data: any): SEOIssue[] {
    const issues: SEOIssue[] = [];

    // Missing title
    if (!data.title || data.title.length === 0) {
      issues.push({
        type: 'missing_title',
        severity: 'critical',
        title: 'Missing Page Title',
        description: 'Page is missing a title tag',
        affectedPages: [data.url]
      });
    }

    // Title too short or too long
    if (data.title.length < 30) {
      issues.push({
        type: 'short_title',
        severity: 'warning',
        title: 'Title Tag Too Short',
        description: `Title is only ${data.title.length} characters. Recommended: 50-60 characters`,
        affectedPages: [data.url]
      });
    } else if (data.title.length > 60) {
      issues.push({
        type: 'long_title',
        severity: 'warning',
        title: 'Title Tag Too Long',
        description: `Title is ${data.title.length} characters. Recommended: 50-60 characters`,
        affectedPages: [data.url]
      });
    }

    // Missing meta description
    if (!data.metaDescription) {
      issues.push({
        type: 'missing_meta_description',
        severity: 'critical',
        title: 'Missing Meta Description',
        description: 'Page is missing a meta description',
        affectedPages: [data.url]
      });
    }

    // Meta description too short or too long
    if (data.metaDescription && data.metaDescription.length < 120) {
      issues.push({
        type: 'short_meta_description',
        severity: 'warning',
        title: 'Meta Description Too Short',
        description: `Meta description is ${data.metaDescription.length} characters. Recommended: 150-160 characters`,
        affectedPages: [data.url]
      });
    }

    // Missing H1 tag
    if (data.h1Tags.length === 0) {
      issues.push({
        type: 'missing_h1',
        severity: 'critical',
        title: 'Missing H1 Tag',
        description: 'Page is missing an H1 heading tag',
        affectedPages: [data.url]
      });
    }

    // Multiple H1 tags
    if (data.h1Tags.length > 1) {
      issues.push({
        type: 'multiple_h1',
        severity: 'warning',
        title: 'Multiple H1 Tags',
        description: `Page has ${data.h1Tags.length} H1 tags. Best practice is to have only one H1 per page`,
        affectedPages: [data.url]
      });
    }

    // Images without alt text
    const imagesWithoutAlt = data.images.filter((img: ImageInfo) => !img.hasAlt);
    if (imagesWithoutAlt.length > 0) {
      issues.push({
        type: 'images_missing_alt',
        severity: 'warning',
        title: 'Images Missing Alt Text',
        description: `${imagesWithoutAlt.length} images are missing alt text`,
        affectedPages: [data.url]
      });
    }

    // Low word count
    if (data.wordCount < 300) {
      issues.push({
        type: 'low_word_count',
        severity: 'notice',
        title: 'Low Word Count',
        description: `Page has only ${data.wordCount} words. Recommended: at least 300 words for better SEO`,
        affectedPages: [data.url]
      });
    }

    // Missing schema markup
    if (!data.hasSchema) {
      issues.push({
        type: 'missing_schema',
        severity: 'notice',
        title: 'Missing Schema Markup',
        description: 'Page does not have structured data (Schema.org) markup',
        affectedPages: [data.url]
      });
    }

    // Not mobile friendly
    if (!data.mobileFriendly) {
      issues.push({
        type: 'not_mobile_friendly',
        severity: 'critical',
        title: 'Not Mobile Friendly',
        description: 'Page is not optimized for mobile devices',
        affectedPages: [data.url]
      });
    }

    // Slow load time
    if (data.loadTime > 3000) {
      issues.push({
        type: 'slow_load_time',
        severity: 'warning',
        title: 'Slow Page Load Time',
        description: `Page load time is ${(data.loadTime / 1000).toFixed(2)}s. Recommended: under 3 seconds`,
        affectedPages: [data.url]
      });
    }

    return issues;
  }

  async crawlSite(startUrl: string, maxPages: number = 100): Promise<CrawlResult[]> {
    const visited = new Set<string>();
    const toVisit: string[] = [startUrl];
    const results: CrawlResult[] = [];
    const domain = new URL(startUrl).hostname;

    while (toVisit.length > 0 && visited.size < maxPages) {
      const url = toVisit.shift()!;

      if (visited.has(url)) {
        continue;
      }

      try {
        console.log(`Crawling: ${url} (${visited.size + 1}/${maxPages})`);
        const result = await this.crawlPage(url);
        results.push(result);
        visited.add(url);

        // Add internal links to queue
        result.internalLinks.forEach(link => {
          const linkDomain = new URL(link).hostname;
          if (linkDomain === domain && !visited.has(link) && !toVisit.includes(link)) {
            toVisit.push(link);
          }
        });
      } catch (error) {
        console.error(`Error crawling ${url}:`, error);
        visited.add(url);
      }
    }

    return results;
  }
}

export default new CrawlerService();
