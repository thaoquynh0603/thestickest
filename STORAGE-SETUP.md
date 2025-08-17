# Supabase Storage Setup Guide

## Problem
Your application is getting a 400 Bad Request error when trying to upload files because the `design-files` storage bucket doesn't exist in your Supabase project.

## Solution

### Step 1: Create the Storage Bucket

1. Go to your Supabase project dashboard: https://supabase.com/dashboard/project/hyrjcmrvrxtepvlpmgxs
2. Navigate to **Storage** in the left sidebar
3. Click **"Create a new bucket"**
4. Configure the bucket:
   - **Name**: `design-files`
   - **Public bucket**: ✅ Yes (since your code uses `getPublicUrl`)
   - **File size limit**: 50MB (or your preferred limit)
5. Click **"Create bucket"**

### Step 2: Add Missing Environment Variable

Add this line to your `.env.local` file:

```bash
# Supabase Service Role Key (required for server-side operations)
# Get this from your Supabase project dashboard > Settings > API
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

To get your service role key:
1. Go to your Supabase project dashboard
2. Navigate to **Settings** > **API**
3. Copy the **service_role** key (not the anon key)

### Step 3: Verify Storage Policies

After creating the bucket, Supabase will automatically set up basic policies:
- **Read access**: Public (since it's a public bucket)
- **Upload access**: Authenticated users only

You can customize these policies in the **Storage** > **Policies** section if needed.

### Step 4: Test File Upload

After completing the setup:
1. Restart your development server
2. Try uploading a file in your design application
3. Check the browser console for any remaining errors

## Alternative: Run Setup Script

You can also run the provided setup script:

```bash
node setup-storage.js
```

This script will:
- Check if Supabase CLI is installed
- Link your project
- Create a migration file for documentation
- Provide step-by-step instructions

## Troubleshooting

### Common Issues

1. **"Bucket not found" error**: Make sure the bucket name is exactly `design-files`
2. **"Access denied" error**: Check your storage policies
3. **"Service role key missing"**: Add the `SUPABASE_SERVICE_ROLE_KEY` to your `.env.local`

### File Size Limits

- Default file size limit: 50MB
- You can adjust this in the bucket settings
- Make sure your frontend validation matches the bucket limit

### Security Considerations

- Public buckets allow anyone to read files
- Upload policies restrict who can upload files
- Consider implementing additional validation for production use

## Code Changes Made

The following improvements were made to `DesignApplication.tsx`:

1. **Bucket existence check**: Added validation to check if the storage bucket exists before attempting upload
2. **Better error messages**: More specific error messages for different failure scenarios
3. **Fallback mechanism**: If upload fails, files are stored locally so users can continue their application
4. **Enhanced logging**: Better console logging for debugging

## Next Steps

1. Create the storage bucket as described above
2. Add the service role key to your environment variables
3. Test file uploads
4. Consider implementing additional security measures for production

If you continue to have issues, check the browser console for more detailed error messages and ensure your Supabase project has the necessary permissions enabled.
