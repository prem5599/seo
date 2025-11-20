-- Migration: Add Comprehensive Audit Features
-- Date: 2025-01-20
-- Description: Adds tables and columns for 100+ SEO audit checks

-- ========================================
-- 1. ENHANCE AUDITS TABLE
-- ========================================

-- Add Core Web Vitals and performance metrics
ALTER TABLE audits ADD COLUMN IF NOT EXISTS performance_score INTEGER DEFAULT 0;
ALTER TABLE audits ADD COLUMN IF NOT EXISTS lcp_score DECIMAL(10, 3); -- Largest Contentful Paint
ALTER TABLE audits ADD COLUMN IF NOT EXISTS inp_score DECIMAL(10, 3); -- Interaction to Next Paint
ALTER TABLE audits ADD COLUMN IF NOT EXISTS cls_score DECIMAL(10, 4); -- Cumulative Layout Shift
ALTER TABLE audits ADD COLUMN IF NOT EXISTS mobile_score INTEGER DEFAULT 0;
ALTER TABLE audits ADD COLUMN IF NOT EXISTS desktop_score INTEGER DEFAULT 0;
ALTER TABLE audits ADD COLUMN IF NOT EXISTS accessibility_score INTEGER DEFAULT 0;
ALTER TABLE audits ADD COLUMN IF NOT EXISTS seo_score INTEGER DEFAULT 0;
ALTER TABLE audits ADD COLUMN IF NOT EXISTS best_practices_score INTEGER DEFAULT 0;

-- Add crawl statistics
ALTER TABLE audits ADD COLUMN IF NOT EXISTS pages_with_errors INTEGER DEFAULT 0;
ALTER TABLE audits ADD COLUMN IF NOT EXISTS pages_with_warnings INTEGER DEFAULT 0;
ALTER TABLE audits ADD COLUMN IF NOT EXISTS broken_links_count INTEGER DEFAULT 0;
ALTER TABLE audits ADD COLUMN IF NOT EXISTS redirect_chains_count INTEGER DEFAULT 0;
ALTER TABLE audits ADD COLUMN IF NOT EXISTS orphan_pages_count INTEGER DEFAULT 0;
ALTER TABLE audits ADD COLUMN IF NOT EXISTS duplicate_content_count INTEGER DEFAULT 0;

-- Add security metrics
ALTER TABLE audits ADD COLUMN IF NOT EXISTS has_ssl BOOLEAN DEFAULT false;
ALTER TABLE audits ADD COLUMN IF NOT EXISTS mixed_content_count INTEGER DEFAULT 0;
ALTER TABLE audits ADD COLUMN IF NOT EXISTS hsts_enabled BOOLEAN DEFAULT false;

-- Add robots.txt and sitemap info
ALTER TABLE audits ADD COLUMN IF NOT EXISTS has_robots_txt BOOLEAN DEFAULT false;
ALTER TABLE audits ADD COLUMN IF NOT EXISTS has_sitemap BOOLEAN DEFAULT false;
ALTER TABLE audits ADD COLUMN IF NOT EXISTS sitemap_url TEXT;
ALTER TABLE audits ADD COLUMN IF NOT EXISTS robots_txt_url TEXT;

-- ========================================
-- 2. ENHANCE PAGE_DETAILS TABLE
-- ========================================

-- Add comprehensive SEO metrics
ALTER TABLE page_details ADD COLUMN IF NOT EXISTS title_length INTEGER;
ALTER TABLE page_details ADD COLUMN IF NOT EXISTS meta_description_length INTEGER;
ALTER TABLE page_details ADD COLUMN IF NOT EXISTS h1_count INTEGER DEFAULT 0;
ALTER TABLE page_details ADD COLUMN IF NOT EXISTS h2_count INTEGER DEFAULT 0;
ALTER TABLE page_details ADD COLUMN IF NOT EXISTS h3_count INTEGER DEFAULT 0;

-- Add canonical and indexation
ALTER TABLE page_details ADD COLUMN IF NOT EXISTS canonical_url TEXT;
ALTER TABLE page_details ADD COLUMN IF NOT EXISTS is_canonical BOOLEAN DEFAULT true;
ALTER TABLE page_details ADD COLUMN IF NOT EXISTS robots_meta TEXT;
ALTER TABLE page_details ADD COLUMN IF NOT EXISTS is_indexable BOOLEAN DEFAULT true;
ALTER TABLE page_details ADD COLUMN IF NOT EXISTS is_nofollow BOOLEAN DEFAULT false;

-- Add content quality metrics
ALTER TABLE page_details ADD COLUMN IF NOT EXISTS content_quality_score INTEGER;
ALTER TABLE page_details ADD COLUMN IF NOT EXISTS keyword_density DECIMAL(5, 2);
ALTER TABLE page_details ADD COLUMN IF NOT EXISTS has_author_info BOOLEAN DEFAULT false;
ALTER TABLE page_details ADD COLUMN IF NOT EXISTS content_freshness_days INTEGER;
ALTER TABLE page_details ADD COLUMN IF NOT EXISTS readability_score INTEGER;

-- Add performance metrics
ALTER TABLE page_details ADD COLUMN IF NOT EXISTS page_size_bytes BIGINT;
ALTER TABLE page_details ADD COLUMN IF NOT EXISTS response_time_ms INTEGER;
ALTER TABLE page_details ADD COLUMN IF NOT EXISTS lcp_ms INTEGER;
ALTER TABLE page_details ADD COLUMN IF NOT EXISTS inp_ms INTEGER;
ALTER TABLE page_details ADD COLUMN IF NOT EXISTS cls_score DECIMAL(10, 4);

-- Add security
ALTER TABLE page_details ADD COLUMN IF NOT EXISTS has_mixed_content BOOLEAN DEFAULT false;
ALTER TABLE page_details ADD COLUMN IF NOT EXISTS ssl_valid BOOLEAN DEFAULT true;

-- Add redirects and links
ALTER TABLE page_details ADD COLUMN IF NOT EXISTS redirect_url TEXT;
ALTER TABLE page_details ADD COLUMN IF NOT EXISTS redirect_type VARCHAR(10);
ALTER TABLE page_details ADD COLUMN IF NOT EXISTS broken_links_count INTEGER DEFAULT 0;
ALTER TABLE page_details ADD COLUMN IF NOT EXISTS nofollow_links_count INTEGER DEFAULT 0;

-- Add crawl depth and links
ALTER TABLE page_details ADD COLUMN IF NOT EXISTS crawl_depth INTEGER DEFAULT 0;
ALTER TABLE page_details ADD COLUMN IF NOT EXISTS inbound_internal_links INTEGER DEFAULT 0;

-- ========================================
-- 3. CREATE TECHNICAL_SEO_METRICS TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS technical_seo_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    audit_id UUID NOT NULL REFERENCES audits(id) ON DELETE CASCADE,

    -- Crawlability
    total_pages_found INTEGER DEFAULT 0,
    pages_crawled INTEGER DEFAULT 0,
    pages_blocked_robots INTEGER DEFAULT 0,
    broken_internal_links INTEGER DEFAULT 0,
    broken_external_links INTEGER DEFAULT 0,
    redirect_chains INTEGER DEFAULT 0,
    orphan_pages INTEGER DEFAULT 0,

    -- Indexation
    pages_with_noindex INTEGER DEFAULT 0,
    pages_with_nofollow INTEGER DEFAULT 0,
    duplicate_titles INTEGER DEFAULT 0,
    duplicate_descriptions INTEGER DEFAULT 0,
    duplicate_content_pages INTEGER DEFAULT 0,

    -- Site Structure
    max_crawl_depth INTEGER DEFAULT 0,
    avg_crawl_depth DECIMAL(5, 2) DEFAULT 0,
    pages_depth_0 INTEGER DEFAULT 0,
    pages_depth_1 INTEGER DEFAULT 0,
    pages_depth_2 INTEGER DEFAULT 0,
    pages_depth_3 INTEGER DEFAULT 0,
    pages_depth_4_plus INTEGER DEFAULT 0,

    -- URL Structure
    urls_with_parameters INTEGER DEFAULT 0,
    urls_too_long INTEGER DEFAULT 0,
    urls_with_underscores INTEGER DEFAULT 0,

    -- Canonical & Duplicates
    pages_with_canonical INTEGER DEFAULT 0,
    pages_without_canonical INTEGER DEFAULT 0,
    conflicting_canonicals INTEGER DEFAULT 0,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_technical_seo_audit_id ON technical_seo_metrics(audit_id);

-- ========================================
-- 4. CREATE CONTENT_QUALITY_METRICS TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS content_quality_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    audit_id UUID NOT NULL REFERENCES audits(id) ON DELETE CASCADE,

    -- E-E-A-T Signals
    pages_with_author_info INTEGER DEFAULT 0,
    pages_without_author_info INTEGER DEFAULT 0,
    avg_content_age_days INTEGER DEFAULT 0,
    pages_over_1_year_old INTEGER DEFAULT 0,

    -- Content Depth
    avg_word_count INTEGER DEFAULT 0,
    pages_thin_content INTEGER DEFAULT 0,  -- < 300 words
    pages_medium_content INTEGER DEFAULT 0, -- 300-1000 words
    pages_comprehensive_content INTEGER DEFAULT 0, -- > 1000 words

    -- Keyword Optimization
    pages_with_keyword_stuffing INTEGER DEFAULT 0,
    pages_with_hidden_text INTEGER DEFAULT 0,
    avg_keyword_density DECIMAL(5, 2) DEFAULT 0,

    -- Readability
    avg_readability_score INTEGER DEFAULT 0,
    pages_poor_readability INTEGER DEFAULT 0,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_content_quality_audit_id ON content_quality_metrics(audit_id);

-- ========================================
-- 5. CREATE PERFORMANCE_METRICS TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS performance_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    audit_id UUID NOT NULL REFERENCES audits(id) ON DELETE CASCADE,

    -- Core Web Vitals (Aggregate)
    lcp_good_pages INTEGER DEFAULT 0,       -- < 2.5s
    lcp_needs_improvement INTEGER DEFAULT 0, -- 2.5-4.0s
    lcp_poor_pages INTEGER DEFAULT 0,       -- > 4.0s
    avg_lcp_score DECIMAL(10, 3),

    inp_good_pages INTEGER DEFAULT 0,       -- < 100ms
    inp_needs_improvement INTEGER DEFAULT 0, -- 100-500ms
    inp_poor_pages INTEGER DEFAULT 0,       -- > 500ms
    avg_inp_score DECIMAL(10, 3),

    cls_good_pages INTEGER DEFAULT 0,       -- < 0.1
    cls_needs_improvement INTEGER DEFAULT 0, -- 0.1-0.25
    cls_poor_pages INTEGER DEFAULT 0,       -- > 0.25
    avg_cls_score DECIMAL(10, 4),

    -- Page Speed
    avg_load_time_ms INTEGER DEFAULT 0,
    pages_slow_load INTEGER DEFAULT 0,      -- > 3s

    -- Resource Optimization
    unoptimized_images INTEGER DEFAULT 0,
    render_blocking_resources INTEGER DEFAULT 0,
    unused_css_count INTEGER DEFAULT 0,
    unused_js_count INTEGER DEFAULT 0,

    -- Mobile
    pages_not_mobile_friendly INTEGER DEFAULT 0,
    small_tap_targets_count INTEGER DEFAULT 0,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_performance_metrics_audit_id ON performance_metrics(audit_id);

-- ========================================
-- 6. CREATE SECURITY_METRICS TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS security_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    audit_id UUID NOT NULL REFERENCES audits(id) ON DELETE CASCADE,

    -- SSL/HTTPS
    https_pages INTEGER DEFAULT 0,
    http_pages INTEGER DEFAULT 0,
    mixed_content_pages INTEGER DEFAULT 0,
    ssl_certificate_valid BOOLEAN DEFAULT true,
    ssl_certificate_expiry_days INTEGER,
    hsts_enabled BOOLEAN DEFAULT false,

    -- Security Headers
    has_x_frame_options BOOLEAN DEFAULT false,
    has_x_content_type_options BOOLEAN DEFAULT false,
    has_x_xss_protection BOOLEAN DEFAULT false,
    has_content_security_policy BOOLEAN DEFAULT false,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_security_metrics_audit_id ON security_metrics(audit_id);

-- ========================================
-- 7. CREATE ACCESSIBILITY_METRICS TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS accessibility_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    audit_id UUID NOT NULL REFERENCES audits(id) ON DELETE CASCADE,

    -- WCAG Compliance
    wcag_level_a_compliance INTEGER DEFAULT 0,   -- Percentage
    wcag_level_aa_compliance INTEGER DEFAULT 0,  -- Percentage
    wcag_level_aaa_compliance INTEGER DEFAULT 0, -- Percentage

    -- Images
    images_without_alt INTEGER DEFAULT 0,
    images_with_empty_alt INTEGER DEFAULT 0,

    -- Forms
    forms_without_labels INTEGER DEFAULT 0,
    inputs_without_labels INTEGER DEFAULT 0,

    -- Color Contrast
    low_contrast_elements INTEGER DEFAULT 0,

    -- Keyboard Navigation
    pages_keyboard_accessible INTEGER DEFAULT 0,
    pages_not_keyboard_accessible INTEGER DEFAULT 0,

    -- Semantic HTML
    pages_missing_landmarks INTEGER DEFAULT 0,
    pages_missing_headings INTEGER DEFAULT 0,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_accessibility_metrics_audit_id ON accessibility_metrics(audit_id);

-- ========================================
-- 8. CREATE SPAM_DETECTION_METRICS TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS spam_detection_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    audit_id UUID NOT NULL REFERENCES audits(id) ON DELETE CASCADE,

    -- Spam Indicators
    keyword_stuffing_pages INTEGER DEFAULT 0,
    hidden_text_pages INTEGER DEFAULT 0,
    cloaking_detected BOOLEAN DEFAULT false,
    doorway_pages_count INTEGER DEFAULT 0,

    -- Link Schemes
    exact_match_anchor_percentage DECIMAL(5, 2),
    suspicious_link_patterns BOOLEAN DEFAULT false,

    -- Structured Data Abuse
    fake_review_schema_count INTEGER DEFAULT 0,
    misleading_schema_count INTEGER DEFAULT 0,

    -- User-Generated Spam
    spam_comments_count INTEGER DEFAULT 0,
    link_spam_count INTEGER DEFAULT 0,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_spam_detection_audit_id ON spam_detection_metrics(audit_id);

-- ========================================
-- 9. CREATE BACKLINK_METRICS TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS backlink_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    audit_id UUID NOT NULL REFERENCES audits(id) ON DELETE CASCADE,

    -- Backlink Profile
    total_backlinks INTEGER DEFAULT 0,
    unique_domains INTEGER DEFAULT 0,
    toxic_backlinks INTEGER DEFAULT 0,
    authority_score INTEGER DEFAULT 0,

    -- Link Quality
    dofollow_links INTEGER DEFAULT 0,
    nofollow_links INTEGER DEFAULT 0,

    -- Anchor Text
    exact_match_anchors INTEGER DEFAULT 0,
    partial_match_anchors INTEGER DEFAULT 0,
    branded_anchors INTEGER DEFAULT 0,
    generic_anchors INTEGER DEFAULT 0,
    url_anchors INTEGER DEFAULT 0,

    -- Link Velocity
    links_last_30_days INTEGER DEFAULT 0,
    links_last_90_days INTEGER DEFAULT 0,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_backlink_metrics_audit_id ON backlink_metrics(audit_id);

-- ========================================
-- 10. ENHANCE ISSUES TABLE
-- ========================================

-- Add priority scoring and fix information
ALTER TABLE issues ADD COLUMN IF NOT EXISTS priority_score INTEGER DEFAULT 0;
ALTER TABLE issues ADD COLUMN IF NOT EXISTS impact_score INTEGER DEFAULT 0;
ALTER TABLE issues ADD COLUMN IF NOT EXISTS urgency_score INTEGER DEFAULT 0;
ALTER TABLE issues ADD COLUMN IF NOT EXISTS difficulty_score INTEGER DEFAULT 0;
ALTER TABLE issues ADD COLUMN IF NOT EXISTS estimated_time_hours INTEGER;
ALTER TABLE issues ADD COLUMN IF NOT EXISTS estimated_traffic_impact INTEGER;
ALTER TABLE issues ADD COLUMN IF NOT EXISTS fix_steps TEXT[];
ALTER TABLE issues ADD COLUMN IF NOT EXISTS external_resources TEXT[];

-- ========================================
-- 11. ENHANCE RECOMMENDATIONS TABLE
-- ========================================

ALTER TABLE recommendations ADD COLUMN IF NOT EXISTS category VARCHAR(50);
ALTER TABLE recommendations ADD COLUMN IF NOT EXISTS estimated_traffic_gain INTEGER;
ALTER TABLE recommendations ADD COLUMN IF NOT EXISTS implementation_time_hours INTEGER;
ALTER TABLE recommendations ADD COLUMN IF NOT EXISTS is_quick_win BOOLEAN DEFAULT false;

-- ========================================
-- 12. CREATE AUDIT_CATEGORIES TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS audit_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    audit_id UUID NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL,
    score INTEGER DEFAULT 0,
    issues_count INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_category CHECK (category IN (
        'technical_seo',
        'on_page_seo',
        'content_quality',
        'performance',
        'security',
        'accessibility',
        'spam_detection',
        'backlinks',
        'mobile_usability'
    ))
);

CREATE INDEX idx_audit_categories_audit_id ON audit_categories(audit_id);

-- ========================================
-- 13. CREATE CRAWL_LOG TABLE (for debugging)
-- ========================================

CREATE TABLE IF NOT EXISTS crawl_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    audit_id UUID NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    status_code INTEGER,
    error_message TEXT,
    crawl_time_ms INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_crawl_log_audit_id ON crawl_log(audit_id);
CREATE INDEX idx_crawl_log_created_at ON crawl_log(created_at);

-- ========================================
-- MIGRATION COMPLETE
-- ========================================

-- Add migration tracking
CREATE TABLE IF NOT EXISTS migrations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO migrations (name) VALUES ('001_comprehensive_audit_features')
ON CONFLICT (name) DO NOTHING;
