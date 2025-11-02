import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { auth } from '@/lib/auth';

const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads');
// const UPLOAD_DIR = '/home/azureuser/uploads'


export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    await mkdir(UPLOAD_DIR, { recursive: true });

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return new NextResponse('No file provided', { status: 400 });
    }

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
      return new NextResponse('Invalid file type. Supported: PDF, DOC, DOCX, PPT, PPTX, MP4, MOV, AVI, JPG, PNG, GIF', { status: 400 });
    }

    // Enforce size limit manually
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return new NextResponse('File size exceeds the 50MB limit.', { status: 400 });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = `${timestamp}-${originalName}`;
    const filepath = join(UPLOAD_DIR, filename);

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    const fileUrl = `/uploads/${filename}`;

    return NextResponse.json({
      url: fileUrl,
      filename: file.name,
      type: file.type
    });

  } catch (error) {
    console.error('Error uploading file:', error);
    return new NextResponse('Error uploading file', { status: 500 });
  }
}

