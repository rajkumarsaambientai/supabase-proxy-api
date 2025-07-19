# CustomGPT API Integration Guide

## 🎯 Enhanced Supabase Proxy API for CustomGPT

Your API is now optimized for CustomGPT with **search, filtering, and relationship capabilities**!

## 📋 Available Endpoints

### 1. **Clari Calls** - `/api/clari-calls`
Get call recordings with detailed summaries and insights.

**Query Parameters:**
- `limit=10` - Number of records to return
- `search=revenue` - Search in call titles
- `status=completed` - Filter by call status
- `type=discovery` - Filter by call type
- `account=Adobe` - Filter by account name
- `contact=John` - Filter by participant name
- `deal=Enterprise` - Filter by deal name
- `date_from=2024-01-01` - Filter from date
- `date_to=2024-12-31` - Filter to date

**Example Usage:**
```
GET /api/clari-calls?search=revenue&limit=5
GET /api/clari-calls?account=Adobe&status=completed
GET /api/clari-calls?date_from=2024-01-01&limit=10
```

### 2. **SFDC Accounts** - `/api/sfdc-accounts`
Get customer account information.

**Query Parameters:**
- `limit=10` - Number of records
- `search=Adobe` - Search account names
- `industry=Technology` - Filter by industry
- `revenue_min=1000000` - Filter by minimum revenue

**Example Usage:**
```
GET /api/sfdc-accounts?industry=Technology&limit=5
GET /api/sfdc-accounts?search=Adobe
```

### 3. **SFDC Contacts** - `/api/sfdc-contacts`
Get contact information and relationships.

**Query Parameters:**
- `limit=10` - Number of records
- `search=John` - Search contact names
- `account=Adobe` - Filter by account
- `title=Manager` - Filter by job title

**Example Usage:**
```
GET /api/sfdc-contacts?account=Adobe&limit=10
GET /api/sfdc-contacts?search=John&title=Manager
```

### 4. **SFDC Opportunities** - `/api/sfdc-opportunities`
Get sales opportunities and deals.

**Query Parameters:**
- `limit=10` - Number of records
- `search=Enterprise` - Search opportunity names
- `stage=Closed Won` - Filter by stage
- `account=Adobe` - Filter by account
- `amount_min=100000` - Filter by minimum amount

**Example Usage:**
```
GET /api/sfdc-opportunities?stage=Closed Won&limit=5
GET /api/sfdc-opportunities?account=Adobe&amount_min=1000000
```

### 5. **SFDC Leads** - `/api/sfdc-leads`
Get lead information and status.

**Query Parameters:**
- `limit=10` - Number of records
- `search=John` - Search lead names
- `status=New` - Filter by status
- `source=Website` - Filter by source

**Example Usage:**
```
GET /api/sfdc-leads?status=New&limit=10
GET /api/sfdc-leads?source=Website&search=John
```

## 🔗 Relationship Endpoints (Coming Soon)

### `/api/relationships/account?account_id=123`
Get account details + related contacts, opportunities, and calls.

### `/api/relationships/contact?contact_id=456`
Get contact details + related account and calls.

### `/api/relationships/opportunity?opportunity_id=789`
Get opportunity details + related account and calls.

### `/api/relationships/call?call_id=abc`
Get call details + related account and opportunity.

## 🎯 CustomGPT Action Configuration

### **Action 1: Search Calls**
```yaml
name: search_clari_calls
description: Search Clari call recordings by keywords, account, or date
parameters:
  search: string (optional) - Search term for call titles
  account: string (optional) - Filter by account name
  limit: number (optional) - Number of results (default: 10)
  status: string (optional) - Call status filter
```

### **Action 2: Get Account Details**
```yaml
name: get_account_details
description: Get customer account information and related data
parameters:
  account_id: string (required) - Account ID
  include_contacts: boolean (optional) - Include related contacts
  include_opportunities: boolean (optional) - Include related opportunities
```

### **Action 3: Search Opportunities**
```yaml
name: search_opportunities
description: Search sales opportunities by stage, account, or amount
parameters:
  search: string (optional) - Search term
  stage: string (optional) - Opportunity stage
  account: string (optional) - Account name
  amount_min: number (optional) - Minimum amount
  limit: number (optional) - Number of results
```

## 📊 Response Format Examples

### **Clari Call Response:**
```json
{
  "call_id": "471b104a-abb1-4070-adeb-7ccfa1c7e44a",
  "call_title": "Intro Call: Lakeside Book Co. & Ambient.ai",
  "call_status": "POST_PROCESSING_DONE",
  "call_type": "ZOOM",
  "call_time": "2023-12-19T15:00:00+00:00",
  "call_duration_seconds": 2968,
  "participant_count": 7,
  "participant_names": "jace.henry@ambient.ai; 17653656846; 16122440533",
  "full_summary": "In an Intro Call between Lakeside Book Co. and Ambient.ai...",
  "key_takeaways": "Discussed security challenges and Ambient's technology...",
  "crm_account_name": "Lakeside Book Company",
  "crm_deal_name": ""
}
```

### **Account Response:**
```json
{
  "account_id": "0016g00000641SW",
  "account_name": "Adobe",
  "industry": "Technology",
  "annual_revenue": 22037001000,
  "website": "adobe.com",
  "employees": 30709,
  "billing_city": "San Jose",
  "billing_state": "California",
  "billing_country": "United States",
  "description": "Founded in 1982, Adobe is an American multinational..."
}
```

## 🚀 Benefits for CustomGPT

✅ **Simplified Responses** - Only essential fields, truncated text
✅ **Search Capabilities** - Find specific data quickly
✅ **Filtering Options** - Narrow down results by criteria
✅ **Relationship Support** - Link related data across tables
✅ **No Headers Required** - Works with CustomGPT's limitations
✅ **Optimized Payloads** - Manageable response sizes

## 🔧 Usage Tips for CustomGPT

1. **Start with small limits** - Use `?limit=5` to test
2. **Use specific searches** - Search by account name, contact name, etc.
3. **Filter by status** - Use `status=completed` for finished calls
4. **Date ranges** - Use `date_from` and `date_to` for time-based queries
5. **Combine filters** - Use multiple parameters together

## 📞 API Base URL
```
https://supabase-proxy-api.onrender.com
```

## 🎯 Example CustomGPT Prompts

**"Show me recent calls about revenue discussions"**
```
GET /api/clari-calls?search=revenue&limit=5
```

**"Get Adobe account details and related opportunities"**
```
GET /api/sfdc-accounts?search=Adobe
GET /api/sfdc-opportunities?account=Adobe
```

**"Find contacts at technology companies"**
```
GET /api/sfdc-contacts?account=Technology&limit=10
```

The API is now ready for CustomGPT integration with enhanced search and relationship capabilities! 🚀 