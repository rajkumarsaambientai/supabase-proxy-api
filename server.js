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
    usage: 'Add query parameters like ?limit=10&select=*'
  });
});

// Clari Calls endpoint
app.get('/api/clari-calls', async (req, res) => {
  try {
    const queryParams = new URLSearchParams(req.query).toString();
    const data = await proxyToSupabase('clari_calls', queryParams);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// SFDC Accounts endpoint
app.get('/api/sfdc-accounts', async (req, res) => {
  try {
    const queryParams = new URLSearchParams(req.query).toString();
    const data = await proxyToSupabase('sfdc_accounts', queryParams);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// SFDC Contacts endpoint
app.get('/api/sfdc-contacts', async (req, res) => {
  try {
    const queryParams = new URLSearchParams(req.query).toString();
    const data = await proxyToSupabase('sfdc_contacts', queryParams);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// SFDC Leads endpoint
app.get('/api/sfdc-leads', async (req, res) => {
  try {
    const queryParams = new URLSearchParams(req.query).toString();
    const data = await proxyToSupabase('sfdc_leads', queryParams);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// SFDC Opportunities endpoint
app.get('/api/sfdc-opportunities', async (req, res) => {
  try {
    const queryParams = new URLSearchParams(req.query).toString();
    const data = await proxyToSupabase('sfdc_opportunities', queryParams);
    res.json(data);
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
  console.log(`\n🎯 CustomGPT compatible - no headers required!`);
}); 