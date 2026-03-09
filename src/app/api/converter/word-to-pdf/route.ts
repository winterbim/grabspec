import { NextRequest, NextResponse } from 'next/server';
import { convertWordToPdf, getOutputFilename } from '@/lib/converter';
import { MAX_FILE_SIZE } from '@/types';

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided', status: 400 },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large (max 20MB)', status: 400 },
        { status: 400 }
      );
    }

    const name = file.name.toLowerCase();
    if (!name.endsWith('.docx') && !name.endsWith('.doc')) {
      return NextResponse.json(
        { error: 'File must be a Word document (.docx)', status: 400 },
        { status: 400 }
      );
    }

    const buffer = await file.arrayBuffer();
    const result = await convertWordToPdf(buffer);
    const outputName = getOutputFilename(file.name, 'pdf');

    return new NextResponse(result, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${outputName}"`,
      },
    });
  } catch (error) {
    console.error('Word to PDF conversion error:', error);
    return NextResponse.json(
      { error: 'Conversion failed', status: 500 },
      { status: 500 }
    );
  }
}
