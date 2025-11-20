import { query } from '../config/database';
import crawlerService from './crawler.service';
import recommendationService from './recommendation.service';

export class AuditService {
  async runAudit(auditId: string, url: string, maxPages: number = 100): Promise<void> {
    try {
      // Update audit status to running
      await query(
        'UPDATE audits SET status = $1, updated_at = NOW() WHERE id = $2',
        ['running', auditId]
      );

      // Crawl the website
      const crawlResults = await crawlerService.crawlSite(url, maxPages);

      // Process results
      const allIssues: any[] = [];
      const pageDetails: any[] = [];

      for (const result of crawlResults) {
        // Store page details
        pageDetails.push({
          audit_id: auditId,
          url: result.url,
          status_code: result.statusCode,
          title: result.title,
          meta_description: result.metaDescription,
          h1_tags: result.h1Tags,
          word_count: result.wordCount,
          load_time: result.loadTime / 1000,
          mobile_friendly: result.mobileFriendly,
          has_schema: result.hasSchema,
          internal_links_count: result.internalLinks.length,
          external_links_count: result.externalLinks.length,
          images_count: result.images.length,
          images_without_alt: result.images.filter(img => !img.hasAlt).length
        });

        // Collect issues
        allIssues.push(...result.issues);
      }

      // Save page details
      for (const page of pageDetails) {
        await query(
          `INSERT INTO page_details (
            audit_id, url, status_code, title, meta_description, h1_tags,
            word_count, load_time, mobile_friendly, has_schema,
            internal_links_count, external_links_count, images_count, images_without_alt
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
          [
            page.audit_id, page.url, page.status_code, page.title,
            page.meta_description, page.h1_tags, page.word_count,
            page.load_time, page.mobile_friendly, page.has_schema,
            page.internal_links_count, page.external_links_count,
            page.images_count, page.images_without_alt
          ]
        );
      }

      // Aggregate issues by type
      const issueMap = new Map<string, any>();

      for (const issue of allIssues) {
        const key = `${issue.type}_${issue.severity}`;
        if (issueMap.has(key)) {
          const existing = issueMap.get(key);
          existing.affectedPages.push(...issue.affectedPages);
          existing.affectedCount++;
        } else {
          issueMap.set(key, {
            ...issue,
            affectedCount: 1,
            affectedPages: [...issue.affectedPages]
          });
        }
      }

      // Save issues and recommendations
      for (const issue of issueMap.values()) {
        const issueResult = await query(
          `INSERT INTO issues (
            audit_id, issue_type, severity, title, description,
            affected_pages, affected_count, recommendation
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
          [
            auditId,
            issue.type,
            issue.severity,
            issue.title,
            issue.description,
            issue.affectedPages,
            issue.affectedCount,
            issue.description
          ]
        );

        const issueId = issueResult.rows[0].id;

        // Generate recommendation
        const recommendation = recommendationService.generateRecommendation(issue.type, issue.severity);

        await query(
          `INSERT INTO recommendations (
            issue_id, title, description, effort_level, impact_level, fix_guide, external_resources
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            issueId,
            recommendation.title,
            recommendation.description,
            recommendation.effortLevel,
            recommendation.impactLevel,
            recommendation.fixGuide,
            recommendation.externalResources
          ]
        );
      }

      // Calculate health score
      const healthScore = this.calculateHealthScore(issueMap);

      // Count issues by severity
      const criticalCount = Array.from(issueMap.values()).filter(i => i.severity === 'critical').length;
      const warningCount = Array.from(issueMap.values()).filter(i => i.severity === 'warning').length;
      const noticeCount = Array.from(issueMap.values()).filter(i => i.severity === 'notice').length;

      // Update audit with results
      await query(
        `UPDATE audits SET
          status = $1,
          health_score = $2,
          total_pages_crawled = $3,
          critical_issues_count = $4,
          warnings_count = $5,
          notices_count = $6,
          completed_at = NOW(),
          updated_at = NOW()
        WHERE id = $7`,
        ['completed', healthScore, crawlResults.length, criticalCount, warningCount, noticeCount, auditId]
      );

      console.log(`✅ Audit ${auditId} completed successfully`);
    } catch (error) {
      console.error(`❌ Audit ${auditId} failed:`, error);

      // Update audit status to failed
      await query(
        'UPDATE audits SET status = $1, updated_at = NOW() WHERE id = $2',
        ['failed', auditId]
      );

      throw error;
    }
  }

  private calculateHealthScore(issueMap: Map<string, any>): number {
    let score = 100;

    for (const issue of issueMap.values()) {
      switch (issue.severity) {
        case 'critical':
          score -= 10;
          break;
        case 'warning':
          score -= 5;
          break;
        case 'notice':
          score -= 2;
          break;
      }
    }

    return Math.max(0, Math.min(100, score));
  }
}

export default new AuditService();
