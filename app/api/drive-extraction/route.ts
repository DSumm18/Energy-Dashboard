import { NextRequest, NextResponse } from 'next/server';

import { downloadDriveFile, listDriveInvoiceFiles } from '@/lib/google-drive';
import { extractInvoiceFromBuffer } from '@/lib/invoice-extraction';
import type { ExtractedInvoiceRecord } from '@/types';

interface ExtractionError {
  fileId: string;
  fileName: string;
  message: string;
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json().catch(() => ({}));
    const folderId: string | undefined = payload.folderId || process.env.GOOGLE_DRIVE_FOLDER_ID;

    if (!folderId) {
      return NextResponse.json(
        {
          success: false,
          error: 'No Google Drive folder ID provided. Set GOOGLE_DRIVE_FOLDER_ID or include folderId in the request body.',
        },
        { status: 400 },
      );
    }

    const files = await listDriveInvoiceFiles(folderId);

    if (files.length === 0) {
      return NextResponse.json({
        success: true,
        records: [],
        processedCount: 0,
        errorCount: 0,
        message: 'No supported documents were found in the specified Drive folder.',
      });
    }

    const records: ExtractedInvoiceRecord[] = [];
    const errors: ExtractionError[] = [];

    for (const file of files) {
      try {
        const { data, mimeType, fileName } = await downloadDriveFile(file.id);
        const record = await extractInvoiceFromBuffer({
          buffer: data,
          mimeType,
          siteName: file.siteName,
          fileId: file.id,
          fileName,
        });

        records.push(record);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error occurred during extraction.';
        errors.push({
          fileId: file.id,
          fileName: file.name,
          message,
        });
      }
    }

    return NextResponse.json({
      success: errors.length === 0,
      records,
      processedCount: records.length,
      errorCount: errors.length,
      errors,
    });
  } catch (error) {
    console.error('Failed to extract invoices from Google Drive:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process Google Drive invoices. Check server logs for details.',
      },
      { status: 500 },
    );
  }
}
