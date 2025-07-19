# Supabase Proxy API - CustomGPT Compatible

A simple Express.js API that proxies requests to Supabase tables without requiring authentication headers. Perfect for CustomGPT Actions!

## 🚀 Features

- **No Authentication Required**: Public endpoints that don't require headers
- **CustomGPT Compatible**: Simple GET requests work perfectly
- **Query Parameter Support**: All Supabase query parameters supported
- **CORS Enabled**: Works from any origin
- **Error Handling**: Proper error responses

## 📋 Available Endpoints

| Table | Endpoint | Description |
|-------|----------|-------------|
| Clari Calls | `/api/clari-calls` | All Clari call data |
| SFDC Accounts | `/api/sfdc-accounts` | Salesforce accounts |
| SFDC Contacts | `/api/sfdc-contacts` | Salesforce contacts |
| SFDC Leads | `/api/sfdc-leads` | Salesforce leads |
| SFDC Opportunities | `/api/sfdc-opportunities` | Salesforce opportunities |

## 🔧 Deployment to Render

### 1. Create Render Account
- Go to [render.com](https://render.com)
- Sign up for a free account

### 2. Deploy the API
1. **Connect GitHub**: Link your GitHub account to Render
2. **New Web Service**: Click "New" → "Web Service"
3. **Select Repository**: Choose this repository
4. **Configure**:
   - **Name**: `supabase-proxy-api`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

### 3. Environment Variables (Optional)
The API uses hardcoded Supabase credentials, but you can set these as environment variables:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

## 🎯 Usage Examples

### Basic Usage
```bash
# Get all accounts (limited to 10 by default)
curl https://your-app.onrender.com/api/sfdc-accounts

# Get specific number of records
curl https://your-app.onrender.com/api/sfdc-accounts?limit=5

# Select specific columns
curl https://your-app.onrender.com/api/sfdc-accounts?select=account_name,industry,annual_revenue
```

### CustomGPT Configuration
For CustomGPT Actions, use these URLs:
- **Clari Calls**: `https://your-app.onrender.com/api/clari-calls`
- **SFDC Accounts**: `https://your-app.onrender.com/api/sfdc-accounts`
- **SFDC Contacts**: `https://your-app.onrender.com/api/sfdc-contacts`
- **SFDC Leads**: `https://your-app.onrender.com/api/sfdc-leads`
- **SFDC Opportunities**: `https://your-app.onrender.com/api/sfdc-opportunities`

**No headers required!** Just use the URL directly.

## 📊 Query Parameters

All standard Supabase query parameters are supported:
- `limit`: Number of records to return
- `select`: Columns to select (e.g., `*`, `account_name,industry`)
- `order`: Sort order (e.g., `created_at.desc`)
- `eq`: Equality filter (e.g., `industry.eq.Technology`)
- `gt`, `gte`, `lt`, `lte`: Comparison filters
- `like`: Text search (e.g., `account_name.like.%Adobe%`)

## 🔒 Security

- **Read-only access**: Only GET requests supported
- **No authentication required**: Public endpoints
- **CORS enabled**: Works from any origin
- **Rate limiting**: Consider adding rate limiting for production

## 🛠️ Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Test endpoints
curl http://localhost:3000/api/sfdc-accounts?limit=1
```

## 📝 Notes

- **Free Tier**: Render's free tier has some limitations but works well for this use case
- **Cold Starts**: Free tier may have cold start delays
- **Custom Domain**: You can add a custom domain in Render dashboard
- **Monitoring**: Render provides basic monitoring and logs

## 🎉 Success!

Once deployed, your CustomGPT Actions will work perfectly without any header authentication issues! 