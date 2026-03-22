#!/usr/bin/env npx ts-node

/**
 * Database Schema Verification Test
 * Checks if donation tables were created by the migration
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

// Load environment variables from .env file
const envPath = path.join(__dirname, '..', '.env')
const envContent = fs.readFileSync(envPath, 'utf-8')
const envVars: Record<string, string> = {}
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/)
  if (match) {
    envVars[match[1].trim()] = match[2].trim()
  }
})

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || envVars.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:55321'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH'

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
})

async function verifySchema() {
  console.log('\n🔍 Verifying Donation Schema in Database...\n')
  console.log(`Supabase URL: ${supabaseUrl}\n`)

  const tables = [
    'organizer_billing_accounts',
    'organizer_balances',
    'donation_transactions',
    'balance_ledger',
    'withdrawal_requests',
    'in_kind_donation_intents',
  ]

  let allTablesExist = true

  for (const table of tables) {
    try {
      // Try to query each table with a limit of 0 to just check existence and schema
      const { error } = await (supabase as any)
        .from(table)
        .select('*', { count: 'exact', head: true })
        .limit(0)

      if (error && error.code === 'PGRST116') {
        // Table exists, just no rows - this is fine
        console.log(`✓ Table exists: ${table}`)
      } else if (error) {
        console.log(`✗ Error accessing ${table}: ${error.message}`)
        allTablesExist = false
      } else {
        console.log(`✓ Table exists: ${table}`)
      }
    } catch (err) {
      console.log(`✗ Error accessing ${table}: ${(err as any).message}`)
      allTablesExist = false
    }
  }

  console.log('\n')

  if (allTablesExist) {
    console.log('✨ All donation tables exist in the database!')
    console.log('\nNext steps:')
    console.log('1. Create test data (users, posts, events)')
    console.log('2. Test donation checkout flow')
    console.log('3. Test webhook processing')
    console.log('4. Verify balance calculations')
    console.log('5. Test withdrawal requests and approvals\n')
    return 0
  } else {
    console.log('⚠️  Some donation tables are missing. Check migration status.\n')
    return 1
  }
}

// Run verification
verifySchema()
  .then(code => process.exit(code))
  .catch(err => {
    console.error('Fatal error:', err)
    process.exit(1)
  })
