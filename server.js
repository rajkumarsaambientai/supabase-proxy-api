const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Supabase configuration
const SUPABASE_URL = 'https://jwpgtjibqvealvbdehdn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3cGd0amlicXZlYWx2YmRlaGRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0MzU4NzQsImV4cCI6MjA2ODAxMTg3NH0.RH0PxIe1wic1wXhaivoCTU4J3W2-7jb14jMYouWXYAQ';

// Helper function to proxy requests to Supabase
async function proxyToSupabase(tableName, queryParams = '') {
  try {
    const url = `${SUPABASE_URL}/rest/v1/${tableName}?${queryParams}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Supabase API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error proxying to ${tableName}:`, error);
    throw error;
  }
}

// Helper function to simplify data for CustomGPT
function simplifyData(data, tableType) {
  if (!Array.isArray(data)) {
    return data;
  }

  return data.map(item => {
    switch (tableType) {
      case 'sfdc_accounts':
        return {
          account_id: item.account_id,
          account_name: item.account_name,
          industry: item.industry,
          annual_revenue: item.annual_revenue,
          website: item.website,
          employees: item.employees,
          billing_city: item.billing_city,
          billing_state: item.billing_state_province,
          billing_country: item.billing_country,
          description: item.description?.substring(0, 200) + '...' || null
        };
      
      case 'sfdc_contacts':
        return {
          contact_id: item.contact_id,
          first_name: item.first_name,
          last_name: item.last_name,
          email: item.email,
          phone: item.phone,
          title: item.title,
          account_name: item.account_name,
          department: item.department
        };
      
      case 'sfdc_leads':
        return {
          lead_id: item.lead_id,
          first_name: item.first_name,
          last_name: item.last_name,
          email: item.email,
          phone: item.phone,
          company: item.company,
          title: item.title,
          status: item.status,
          source: item.lead_source
        };
      
      case 'sfdc_opportunities':
        return {
          opportunity_id: item.opportunity_id,
          opportunity_name: item.opportunity_name,
          account_name: item.account_name,
          amount: item.amount,
          stage: item.stage_name,
          close_date: item.close_date,
          probability: item.probability,
          type: item.type
        };
      
      case 'clari_calls':
        return {
          call_id: item.call_id,
          call_title: item.call_title,
          call_status: item.call_status,
          call_type: item.call_type,
          call_time: item.call_time,
          call_duration_seconds: item.call_duration_seconds,
          participant_count: item.participant_count,
          participant_names: item.participant_names,
          full_summary: item.full_summary?.substring(0, 300) + '...' || null,
          key_takeaways: item.key_takeaways?.substring(0, 200) + '...' || null,
          crm_account_name: item.crm_account_name,
          crm_deal_name: item.crm_deal_name
        };
      
      default:
        return item;
    }
  });
}

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Supabase Proxy API - CustomGPT Compatible',
    endpoints: [
      '/api/clari-calls',
      '/api/sfdc-accounts', 
      '/api/sfdc-contacts',
      '/api/sfdc-leads',
      '/api/sfdc-opportunities'
    ],
    usage: 'Add query parameters like ?limit=10&select=*',
    note: 'Responses are simplified for CustomGPT compatibility'
  });
});

// Clari Calls endpoint
app.get('/api/clari-calls', async (req, res) => {
  try {
    const queryParams = new URLSearchParams(req.query).toString();
    const data = await proxyToSupabase('clari_calls', queryParams);
    const simplifiedData = simplifyData(data, 'clari_calls');
    res.json(simplifiedData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// SFDC Accounts endpoint
app.get('/api/sfdc-accounts', async (req, res) => {
  try {
    const queryParams = new URLSearchParams(req.query).toString();
    const data = await proxyToSupabase('sfdc_accounts', queryParams);
    const simplifiedData = simplifyData(data, 'sfdc_accounts');
    res.json(simplifiedData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// SFDC Contacts endpoint
app.get('/api/sfdc-contacts', async (req, res) => {
  try {
    const queryParams = new URLSearchParams(req.query).toString();
    const data = await proxyToSupabase('sfdc_contacts', queryParams);
    const simplifiedData = simplifyData(data, 'sfdc_contacts');
    res.json(simplifiedData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// SFDC Leads endpoint
app.get('/api/sfdc-leads', async (req, res) => {
  try {
    const queryParams = new URLSearchParams(req.query).toString();
    const data = await proxyToSupabase('sfdc_leads', queryParams);
    const simplifiedData = simplifyData(data, 'sfdc_leads');
    res.json(simplifiedData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// SFDC Opportunities endpoint
app.get('/api/sfdc-opportunities', async (req, res) => {
  try {
    const queryParams = new URLSearchParams(req.query).toString();
    const data = await proxyToSupabase('sfdc_opportunities', queryParams);
    const simplifiedData = simplifyData(data, 'sfdc_opportunities');
    res.json(simplifiedData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Supabase Proxy API running on port ${PORT}`);
  console.log(`📋 Available endpoints:`);
  console.log(`   • GET /api/clari-calls`);
  console.log(`   • GET /api/sfdc-accounts`);
  console.log(`   • GET /api/sfdc-contacts`);
  console.log(`   • GET /api/sfdc-leads`);
  console.log(`   • GET /api/sfdc-opportunities`);
  console.log(`\n🎯 CustomGPT compatible - simplified responses!`);
}); 