import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size must be less than 5MB' },
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
