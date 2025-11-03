import { NextResponse } from 'next/server';
import { writeFile, mkdir, access } from 'fs/promises';
import { join } from 'path';
import { auth } from '@/lib/auth';
import { constants } from 'fs';

const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads');

export async function POST(req: Request) {
  try {
    console.log('=== Upload Request Started ===');
    
    const session = await auth();
    if (!session?.user?.id) {
      console.error('Unauthorized upload attempt');
      return new NextResponse('Unauthorized', { status: 401 });
    }

    console.log(`User ID: ${session.user.id}`);
    console.log(`Upload directory: ${UPLOAD_DIR}`);

    // Check if directory exists and is writable
    try {
      await access(UPLOAD_DIR, constants.W_OK);
      console.log('Upload directory is writable');
    } catch (error) {
      console.error('Upload directory not writable, attempting to create...');
      await mkdir(UPLOAD_DIR, { recursive: true });
      console.log('Upload directory created');
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      console.error('No file provided in request');
      return new NextResponse('No file provided', { status: 400 });
    }

    console.log(`File received: ${file.name}`);
    console.log(`File size: ${file.size} bytes (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
    console.log(`File type: ${file.type}`);

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'video/mp4',
      'video/quicktime',
      'video/x-msvideo',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      console.error(`Invalid file type: ${file.type}`);
      return new NextResponse('Invalid file type. Supported: PDF, DOC, DOCX, PPT, PPTX, MP4, MOV, AVI, JPG, PNG, GIF', { status: 400 });
    }

    // Enforce size limit manually
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      console.error(`File too large: ${file.size} bytes (max: ${maxSize})`);
      return new NextResponse('File size exceeds the 50MB limit.', { status: 400 });
    }

    // Generate unique filename with better sanitization
    const timestamp = Date.now();
    const originalName = file.name
      .replace(/\s+/g, '_')           // Replace spaces
      .replace(/[^a-zA-Z0-9._-]/g, '') // Remove special chars
      .substring(0, 100);              // Limit length
    const filename = `${timestamp}-${originalName}`;
    const filepath = join(UPLOAD_DIR, filename);

    console.log(`Saving file: ${filename}`);

    try {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      console.log(`Writing ${buffer.length} bytes...`);
      await writeFile(filepath, buffer);
      console.log('File written successfully');
      
      // Verify file was written
      try {
        await access(filepath, constants.R_OK);
        console.log('File verified readable');
      } catch (verifyError) {
        console.error('File verification failed:', verifyError);
        throw new Error('File saved but not readable');
      }

    } catch (writeError) {
      console.error('File write error:', writeError);
      throw writeError;
    }

    const fileUrl = `/uploads/${filename}`;
    console.log(`File URL: ${fileUrl}`);
    console.log('=== Upload Request Completed ===');

    return NextResponse.json({
      url: fileUrl,
      filename: file.name,
      type: file.type,
      size: file.size
    });

  } catch (error) {
    // Log full error details server-side only
    console.error('=== Upload Error ===');
    console.error('Error type:', error?.constructor?.name);
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('Full error object:', error);
    console.error('=== End Upload Error ===');
    
    // Return generic error message to client (no sensitive info)
    return new NextResponse('Error uploading file', { status: 500 });
  }
}