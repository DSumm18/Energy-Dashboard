import { NextRequest, NextResponse } from 'next/server';
import { extractInvoiceFromBuffer } from '@/lib/invoice-extraction';
import type { ExtractedInvoiceRecord } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (files.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No files provided' },
        { status: 400 }
      );
    }

    const records: ExtractedInvoiceRecord[] = [];
    const errors: { file: string; message: string }[] = [];
    let processedCount = 0;

    for (const file of files) {
      try {
        // Convert file to buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Extract invoice data using Gemini AI
        const extraction = await extractInvoiceFromBuffer({
          buffer,
          mimeType: file.type,
          siteName: 'Local Upload', // Default site name
          fileId: file.name,
          fileName: file.name,
        });

        records.push(extraction);
        processedCount++;
      } catch (error: any) {
        errors.push({
          file: file.name,
          message: error?.message || 'Failed to process file',
        });
      }
    }

    return NextResponse.json({
      success: true,
      processedCount,
      recordsInserted: records.length,
      recordsUpdated: 0,
      records: records, // Return the extracted data
      errors: errors.length > 0 ? errors : undefined,
    });

  } catch (error: any) {
    console.error('Local extraction failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Failed to process local files',
      },
      { status: 500 }
    );
  }
}
