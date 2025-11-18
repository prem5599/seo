# Database Setup

## PostgreSQL Setup

### Local Development

1. Install PostgreSQL (if not already installed):
```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib

# macOS
brew install postgresql
```

2. Create database:
```bash
createdb seo_audit_db
```

3. Run schema migration:
```bash
psql -d seo_audit_db -f schema.sql
```

4. (Optional) Load seed data for testing:
```bash
psql -d seo_audit_db -f seed.sql
```

### Using Docker

The project includes Docker configuration that automatically sets up PostgreSQL.

```bash
docker-compose up -d postgres
```

## Database Schema Overview

### Tables

- **users**: User accounts and authentication
- **audits**: Website audit records
- **issues**: SEO issues found during audits
- **recommendations**: Fix recommendations for issues
- **subscriptions**: User subscription information
- **page_details**: Individual page analysis data
- **api_keys**: API key management
- **audit_history**: Historical audit data for trend tracking

### Relationships

- Users → Audits (One-to-Many)
- Audits → Issues (One-to-Many)
- Issues → Recommendations (One-to-Many)
- Users → Subscriptions (One-to-One)
- Audits → Page Details (One-to-Many)

## Environment Variables

Required database environment variables:

```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=seo_audit_db
DB_USER=postgres
DB_PASSWORD=your_secure_password
```
