import { NextRequest, NextResponse } from 'next/server';
import { extractInvoiceFromBuffer } from '@/lib/invoice-extraction';
import type { ExtractedInvoiceRecord } from '@/types';
import { isFileProcessed, markFileAsProcessed } from '@/lib/google-sheets';

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
    let skippedCount = 0;

    // Group files by folder for better organization
    const filesByFolder = new Map<string, File[]>();
    
    for (const file of files) {
      const folderPath = file.webkitRelativePath 
        ? file.webkitRelativePath.split('/').slice(0, -1).join('/') || 'Root'
        : 'Individual Files';
      
      if (!filesByFolder.has(folderPath)) {
        filesByFolder.set(folderPath, []);
      }
      filesByFolder.get(folderPath)!.push(file);
    }

    for (const file of files) {
      try {
        // Check if file already processed
        const alreadyProcessed = await isFileProcessed(file.name, file.name);
        
        if (alreadyProcessed) {
          skippedCount++;
          continue; // Skip already processed files
        }

        // Convert file to buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Determine site name from folder path
        const siteName = file.webkitRelativePath 
          ? file.webkitRelativePath.split('/')[0] || 'Local Upload'
          : 'Local Upload';

        // Extract invoice data using Gemini AI
        const extraction = await extractInvoiceFromBuffer({
          buffer,
          mimeType: file.type,
          siteName,
          fileId: file.name,
          fileName: file.name,
        });

        records.push(extraction);
        processedCount++;

        // Mark file as processed
        await markFileAsProcessed(
          file.name,
          file.name,
          file.size,
          file.type,
          'processed'
        );
      } catch (error: any) {
        // Mark file as failed
        await markFileAsProcessed(
          file.name,
          file.name,
          file.size,
          file.type,
          'failed',
          error.message
        );

        errors.push({
          file: file.name,
          message: error?.message || 'Failed to process file',
        });
      }
    }

    return NextResponse.json({
      success: true,
      processedCount,
      skippedCount,
      recordsInserted: records.length,
      recordsUpdated: 0,
      foldersScanned: filesByFolder.size,
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
