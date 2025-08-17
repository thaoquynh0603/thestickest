import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Configurable max upload size in megabytes via env var MAX_UPLOAD_SIZE_MB
// Default to 50 MB to allow larger design files. Adjust as needed.
const MAX_UPLOAD_SIZE_MB = parseInt(process.env.MAX_UPLOAD_SIZE_MB || '50', 10);
const MAX_UPLOAD_SIZE = MAX_UPLOAD_SIZE_MB * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const applicationId = formData.get('applicationId') as string;
    const fileType = formData.get('fileType') as string; // 'style_reference', 'question_answer', etc.
    const questionId = formData.get('questionId') as string | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!applicationId) {
      return NextResponse.json(
        { error: 'Application ID is required' },
        { status: 400 }
      );
    }

    // Validate file size (configurable limit)
    if (file.size > MAX_UPLOAD_SIZE) {
      return NextResponse.json(
        { error: `File size must be less than ${MAX_UPLOAD_SIZE_MB}MB` },
        { status: 400 }
      );
    }

    // Validate file type: accept any image/* mime type
    const isImage = file.type && file.type.startsWith('image/');
    if (!isImage) {
      return NextResponse.json(
        { error: 'Please upload a valid image file (JPG, PNG, GIF, HEIC, etc.)' },
        { status: 400 }
      );
    }

    // Use anon server client; RLS policies on Storage allow this insert
    const supabase = createClient();

    // If the server is expected to perform DB RPC/inserts that require elevated
    // privileges, ensure the SUPABASE_SERVICE_ROLE_KEY is present. If it's not
    // set, RLS may block inserts and produce confusing errors like
    // "new row violates row-level security policy". Fail fast with a clear
    // message so operators can fix env configuration.
    const hasServiceRole = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
    if (!hasServiceRole) {
      console.error('SUPABASE_SERVICE_ROLE_KEY is not set on the server; RPC/inserts may be blocked by RLS.');
      return NextResponse.json(
        { error: 'Server is not configured with SUPABASE_SERVICE_ROLE_KEY required for recording uploads. Please set SUPABASE_SERVICE_ROLE_KEY in the server environment.' },
        { status: 500 }
      );
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${applicationId}/${fileType}/${Date.now()}.${fileExt}`;

    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('design-files')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload file' },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('design-files')
      .getPublicUrl(fileName);

    // Persist to answers history when we have a questionId
    let rpcResult: any = null;
    if (questionId) {
      try {
        rpcResult = await supabase.rpc('add_design_request_answer_history', {
          p_request_id: applicationId,
          p_question_id: questionId,
          p_answer_text: undefined,
          p_answer_file_url: urlData.publicUrl,
          p_answer_options: undefined,
        });
      } catch (e) {
        console.warn('Failed to log answer history for upload', e);
        return NextResponse.json({ error: 'Uploaded but failed to record answer history', details: String(e) }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: true,
      fileUrl: urlData.publicUrl,
      fileName: fileName,
      rpcResult
    });

  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
