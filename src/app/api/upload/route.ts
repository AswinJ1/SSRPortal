import { NextResponse } from 'next/server';
import { writeFile, mkdir, access, stat } from 'fs/promises';
import { join } from 'path';
import { auth } from '@/lib/auth';
import { constants } from 'fs';

const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads');

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes

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
      const stats = await stat(UPLOAD_DIR);
      
      if (!stats.isDirectory()) {
        console.error('Upload path exists but is not a directory');
        return new NextResponse('Upload configuration error', { status: 500 });
      }
      
      // Check if directory is writable
      try {
        await access(UPLOAD_DIR, constants.W_OK);
        console.log('Upload directory is writable');
      } catch (writeError) {
        console.error('Upload directory exists but is not writable');
        return new NextResponse('Upload configuration error', { status: 500 });
      }
      
    } catch (statError) {
      // Directory doesn't exist, try to create it
      if ((statError as NodeJS.ErrnoException).code === 'ENOENT') {
        console.log('Upload directory does not exist, creating...');
        try {
          await mkdir(UPLOAD_DIR, { recursive: true });
          console.log('Upload directory created successfully');
          
          // Verify the newly created directory is writable
          await access(UPLOAD_DIR, constants.W_OK);
          console.log('New directory is writable');
        } catch (mkdirError) {
          console.error('Failed to create upload directory');
          return new NextResponse('Upload configuration error', { status: 500 });
        }
      } else {
        // Some other error occurred
        console.error('Error checking upload directory');
        return new NextResponse('Upload configuration error', { status: 500 });
      }
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      console.error('No file provided in request');
      return new NextResponse('No file provided', { status: 400 });
    }

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

    // Enforce size limit
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      console.error(`File too large: ${file.size} bytes (max: ${maxSize})`);
      return new NextResponse('File size exceeds the 50MB limit', { status: 400 });
    }

    // Generate unique filename with proper sanitization
    const timestamp = Date.now();
    
    // Extract extension separately (handles "file.tar.gz" correctly)
       const lastDotIndex = file.name.lastIndexOf('.');
    const rawExtension = lastDotIndex !== -1
      ? file.name.substring(lastDotIndex + 1)
      : '';
    const sanitizedExtension = rawExtension
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 10);
    const extension = sanitizedExtension ? `.${sanitizedExtension}` : '';
    
    // Get base name without extension
    const baseName = lastDotIndex !== -1 
      ? file.name.substring(0, lastDotIndex) 
      : file.name;
    
    // Sanitize only the base name
    let safeBase = baseName
      .trim()                           // Remove leading/trailing spaces
      .replace(/\s+/g, '_')            // Collapse spaces to single underscore
      .replace(/[^a-zA-Z0-9._-]/g, '') // Remove invalid characters
      .replace(/_{2,}/g, '_')          // Collapse multiple underscores to single
      .replace(/^[._-]+|[._-]+$/g, ''); // Remove leading/trailing dots/underscores/hyphens
    
    // If base becomes empty, use default
    if (!safeBase) {
      safeBase = 'file';
    }
    
    // Enforce total length: timestamp(13) + separator(1) + base + extension <= 100
    const timestampStr = timestamp.toString();
    const maxBaseLength = Math.max(0, 100 - timestampStr.length - 1 - extension.length);
    if (safeBase.length > maxBaseLength) {
      safeBase = safeBase.substring(0, maxBaseLength);
    }
    
    // Recompose filename with extension always preserved
    const filename = `${timestamp}-${safeBase}${extension}`;
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
        console.error('File verification failed');
        throw new Error('File saved but not readable');
      }

    } catch (writeError) {
      console.error('File write error');
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
    console.error('=== End Upload Error ===');
    
    // Return generic error message to client
    return new NextResponse('Error uploading file', { status: 500 });
  }
}