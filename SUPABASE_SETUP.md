# 🚀 Supabase Database Setup Guide

## 📋 **Step 1: Get Your Supabase Connection String**

1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **Database**
3. Copy the **Connection string** (URI format)
4. Replace `[YOUR-PASSWORD]` with your actual database password

**Format:**
```
postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
```

## 🔧 **Step 2: Configure Environment Variables**

Create a `.env` file in the `backend/` directory:

```env
# Supabase Database Configuration
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres

# Email Configuration (for vendor outreach)
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
FROM_EMAIL=noreply@autoprocure.com
FROM_NAME=AutoProcure

# API Configuration
API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_API_URL=http://localhost:8000

# Optional: Enable SQL query logging for debugging
SQL_ECHO=false
```

## 🗄️ **Step 3: Database Tables**

The system will automatically create these tables when you start the backend:

### **Vendors Table:**
- `id` (Primary Key)
- `vendor_id` (Unique identifier)
- `name` (Vendor contact name)
- `company` (Company name)
- `email` (Email address)
- `phone` (Phone number, optional)
- `address` (Address, optional)
- `created_at`, `updated_at` (Timestamps)

### **RFQs Table:**
- `id` (Primary Key)
- `rfq_id` (Unique identifier)
- `title` (RFQ title)
- `description` (RFQ description)
- `deadline` (Submission deadline)
- `total_budget` (Budget amount)
- `currency` (Currency code)
- `status` (active/closed/cancelled)
- `created_by` (User who created the RFQ)
- `created_at`, `updated_at` (Timestamps)

### **RFQ Participations Table:**
- `id` (Primary Key)
- `participation_id` (Unique identifier)
- `rfq_id` (Foreign key to RFQs)
- `vendor_id` (Foreign key to Vendors)
- `unique_link` (Unique submission link)
- `email_sent` (Boolean)
- `email_sent_at` (Timestamp)
- `status` (pending/submitted/reviewed/rejected)
- `submitted_at` (Timestamp)
- `submission_data` (JSON data)
- `created_at`, `updated_at` (Timestamps)

## 🧪 **Step 4: Test Database Connection**

Run this command to test the connection:

```bash
cd backend
python -c "
from app.database_sqlalchemy import engine
from app.models.vendor import Base
try:
    Base.metadata.create_all(bind=engine)
    print('✅ Database connection successful!')
    print('✅ Tables created successfully!')
except Exception as e:
    print(f'❌ Database connection failed: {e}')
"
```

## 🚀 **Step 5: Start the Application**

```bash
# Backend
cd backend
python -m uvicorn app.main:app --reload

# Frontend (in another terminal)
cd frontend
npm run dev
```

## 🔍 **Step 6: Verify in Supabase Dashboard**

1. Go to your Supabase project
2. Navigate to **Table Editor**
3. You should see the new tables:
   - `vendors`
   - `rfqs`
   - `rfq_participations`

## 🐛 **Troubleshooting**

### **Connection Issues:**
- Verify your DATABASE_URL is correct
- Check that your Supabase project is active
- Ensure your database password is correct

### **Table Creation Issues:**
- Check Supabase logs for any errors
- Verify you have the correct permissions
- Try running the table creation manually

### **API Issues:**
- Check that the backend server is running on port 8000
- Verify CORS settings in main.py
- Check browser console for any errors

## 📊 **Next Steps**

Once the database is connected:

1. **Test Vendor Dashboard:** Create an RFQ and upload a vendor list
2. **Test Email System:** Configure SMTP and send test emails
3. **Test Submission Portal:** Access vendor portal via unique links
4. **Test File Upload:** Upload and process vendor quotes

## 🎯 **Ready to Test!**

Your Supabase database is now ready to power the AutoProcure vendor outreach system! 🚀
