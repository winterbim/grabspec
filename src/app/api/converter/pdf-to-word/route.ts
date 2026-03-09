import { NextRequest, NextResponse } from 'next/server';
import { convertPdfToWord, getOutputFilename } from '@/lib/converter';
import { MAX_FILE_SIZE } from '@/types';

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

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json(
        { error: 'File must be a PDF', status: 400 },
        { status: 400 }
      );
    }

    const buffer = await file.arrayBuffer();
    const result = await convertPdfToWord(buffer);
    const outputName = getOutputFilename(file.name, 'word');

    return new NextResponse(result, {
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${outputName}"`,
      },
    });
  } catch (error) {
    console.error('PDF to Word conversion error:', error);
    return NextResponse.json(
      { error: 'Conversion failed', status: 500 },
      { status: 500 }
    );
  }
}
