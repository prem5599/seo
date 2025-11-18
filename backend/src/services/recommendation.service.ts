interface Recommendation {
  title: string;
  description: string;
  effortLevel: 'easy' | 'medium' | 'hard';
  impactLevel: 'high' | 'medium' | 'low';
  fixGuide: string;
  externalResources: string[];
}

export class RecommendationService {
  private recommendations: Record<string, Recommendation> = {
    missing_title: {
      title: 'Add a Unique Title Tag',
      description: 'Every page needs a unique, descriptive title tag that accurately represents the page content.',
      effortLevel: 'easy',
      impactLevel: 'high',
      fixGuide: `1. Add a <title> tag inside the <head> section of your HTML
2. Make it 50-60 characters long
3. Include your primary keyword near the beginning
4. Make it unique and descriptive

Example:
<title>SEO Audit Tool - Free Website Analysis | YourBrand</title>`,
      externalResources: [
        'https://moz.com/learn/seo/title-tag',
        'https://developers.google.com/search/docs/appearance/title-link'
      ]
    },

    short_title: {
      title: 'Lengthen Your Title Tag',
      description: 'Title tags should be 50-60 characters to maximize visibility in search results.',
      effortLevel: 'easy',
      impactLevel: 'medium',
      fixGuide: `1. Expand your title to 50-60 characters
2. Add more descriptive keywords
3. Include your brand name if space allows
4. Ensure it accurately describes the page content`,
      externalResources: [
        'https://moz.com/learn/seo/title-tag'
      ]
    },

    long_title: {
      title: 'Shorten Your Title Tag',
      description: 'Title tags longer than 60 characters may be truncated in search results.',
      effortLevel: 'easy',
      impactLevel: 'medium',
      fixGuide: `1. Reduce title to 50-60 characters
2. Remove unnecessary words
3. Keep the most important keywords at the beginning
4. Ensure clarity and relevance`,
      externalResources: [
        'https://moz.com/learn/seo/title-tag'
      ]
    },

    missing_meta_description: {
      title: 'Add Meta Description',
      description: 'Meta descriptions help search engines and users understand your page content.',
      effortLevel: 'easy',
      impactLevel: 'high',
      fixGuide: `1. Add a <meta name="description"> tag in the <head> section
2. Make it 150-160 characters long
3. Include your target keywords naturally
4. Write compelling copy that encourages clicks

Example:
<meta name="description" content="Free SEO audit tool that analyzes your website for technical issues, performance problems, and ranking opportunities. Get actionable insights in minutes.">`,
      externalResources: [
        'https://moz.com/learn/seo/meta-description',
        'https://developers.google.com/search/docs/appearance/snippet'
      ]
    },

    short_meta_description: {
      title: 'Lengthen Meta Description',
      description: 'Meta descriptions should be 150-160 characters for optimal display.',
      effortLevel: 'easy',
      impactLevel: 'low',
      fixGuide: `1. Expand to 150-160 characters
2. Add more compelling details about the page
3. Include a call-to-action
4. Incorporate relevant keywords naturally`,
      externalResources: [
        'https://moz.com/learn/seo/meta-description'
      ]
    },

    missing_h1: {
      title: 'Add H1 Heading Tag',
      description: 'Every page should have exactly one H1 tag that describes the main topic.',
      effortLevel: 'easy',
      impactLevel: 'high',
      fixGuide: `1. Add an <h1> tag to your page
2. Make it descriptive and relevant to page content
3. Include your primary keyword
4. Keep it concise (20-70 characters)

Example:
<h1>Complete SEO Audit Tool for Websites</h1>`,
      externalResources: [
        'https://moz.com/learn/seo/on-page-factors'
      ]
    },

    multiple_h1: {
      title: 'Use Only One H1 Tag',
      description: 'Best practice is to have only one H1 tag per page for clear content hierarchy.',
      effortLevel: 'easy',
      impactLevel: 'medium',
      fixGuide: `1. Identify the main topic of your page
2. Keep only one H1 that describes this topic
3. Convert other H1 tags to H2, H3, etc.
4. Ensure proper heading hierarchy (H1 → H2 → H3)`,
      externalResources: [
        'https://developer.mozilla.org/en-US/docs/Web/HTML/Element/Heading_Elements'
      ]
    },

    images_missing_alt: {
      title: 'Add Alt Text to Images',
      description: 'Alt text improves accessibility and helps search engines understand image content.',
      effortLevel: 'easy',
      impactLevel: 'medium',
      fixGuide: `1. Add descriptive alt attributes to all <img> tags
2. Describe what the image shows
3. Include relevant keywords naturally
4. Keep it concise but descriptive

Example:
<img src="dashboard.png" alt="SEO audit dashboard showing health score and issues">`,
      externalResources: [
        'https://moz.com/learn/seo/alt-text',
        'https://www.w3.org/WAI/tutorials/images/'
      ]
    },

    low_word_count: {
      title: 'Increase Content Length',
      description: 'Pages with more comprehensive content tend to rank better in search results.',
      effortLevel: 'medium',
      impactLevel: 'medium',
      fixGuide: `1. Expand content to at least 300 words
2. Add more detailed information about the topic
3. Include relevant keywords naturally
4. Ensure content provides value to users
5. Consider adding sections like FAQs, examples, or use cases`,
      externalResources: [
        'https://moz.com/learn/seo/on-page-factors'
      ]
    },

    missing_schema: {
      title: 'Add Schema Markup',
      description: 'Structured data helps search engines understand your content and can enable rich results.',
      effortLevel: 'hard',
      impactLevel: 'medium',
      fixGuide: `1. Identify appropriate schema type (Article, Product, Organization, etc.)
2. Use Google's Structured Data Markup Helper
3. Add JSON-LD script to your <head> section
4. Test with Google's Rich Results Test

Example:
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "SEO Audit Tool",
  "applicationCategory": "BusinessApplication",
  "offers": {
    "@type": "Offer",
    "price": "0"
  }
}
</script>`,
      externalResources: [
        'https://schema.org/',
        'https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data'
      ]
    },

    not_mobile_friendly: {
      title: 'Make Site Mobile Friendly',
      description: 'Mobile-friendliness is crucial as most searches now happen on mobile devices.',
      effortLevel: 'hard',
      impactLevel: 'high',
      fixGuide: `1. Add viewport meta tag:
   <meta name="viewport" content="width=device-width, initial-scale=1">
2. Use responsive CSS (media queries)
3. Ensure text is readable without zooming
4. Make buttons and links easy to tap
5. Avoid horizontal scrolling
6. Test on multiple devices`,
      externalResources: [
        'https://developers.google.com/search/mobile-sites/mobile-seo',
        'https://web.dev/responsive-web-design-basics/'
      ]
    },

    slow_load_time: {
      title: 'Improve Page Load Speed',
      description: 'Faster pages provide better user experience and tend to rank higher.',
      effortLevel: 'hard',
      impactLevel: 'high',
      fixGuide: `1. Optimize and compress images
2. Minify CSS, JavaScript, and HTML
3. Enable browser caching
4. Use a Content Delivery Network (CDN)
5. Reduce server response time
6. Defer JavaScript loading
7. Remove render-blocking resources

Test with:
- Google PageSpeed Insights
- GTmetrix
- WebPageTest`,
      externalResources: [
        'https://web.dev/fast/',
        'https://developers.google.com/speed/pagespeed/insights/'
      ]
    }
  };

  generateRecommendation(issueType: string, severity: string): Recommendation {
    const recommendation = this.recommendations[issueType];

    if (!recommendation) {
      return {
        title: 'Fix This Issue',
        description: 'This issue should be addressed to improve your SEO.',
        effortLevel: 'medium',
        impactLevel: 'medium',
        fixGuide: 'Please consult SEO best practices for guidance on fixing this issue.',
        externalResources: ['https://moz.com/learn/seo']
      };
    }

    return recommendation;
  }
}

export default new RecommendationService();
