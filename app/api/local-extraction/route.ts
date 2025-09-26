import { NextRequest, NextResponse } from 'next/server';
import { extractInvoiceFromBuffer } from '@/lib/invoice-extraction';
import type { ExtractedInvoiceRecord, TransformedEnergyRecord } from '@/types';
import { isFileProcessed, markFileAsProcessed, upsertEnergyDataRows, createInvoiceExtractSummary } from '@/lib/google-sheets';

// Transform extracted invoice data to energy data format
function transformInvoiceToEnergyData(extracted: ExtractedInvoiceRecord): TransformedEnergyRecord {
  // Parse the invoice period to get year and month
  const periodMatch = extracted.invoicePeriod.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  const year = periodMatch ? parseInt(periodMatch[3]) : new Date().getFullYear();
  const month = periodMatch ? getMonthName(parseInt(periodMatch[2])) : 'Unknown';

  // Determine energy type based on supplier or other indicators
  const energyType = extracted.supplier.toLowerCase().includes('gas') ? 'Gas' : 'Electricity';

  return {
    schoolName: extracted.siteName,
    meterNumber: extracted.meterSerial || extracted.mprn || 'Unknown',
    energyType,
    year,
    month,
    totalKwh: extracted.energyConsumed,
    totalCost: extracted.totalAmount,
    mpan: extracted.mprn,
  };
}

function getMonthName(monthNumber: number): string {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[monthNumber - 1] || 'Unknown';
}

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

    // Set a reasonable timeout for the entire operation
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout after 25 seconds')), 25000);
    });

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

    // Process files with timeout protection
    const processFiles = async () => {
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
          
          // Transform and save to Google Sheets
          const energyData = transformInvoiceToEnergyData(extraction);
          const saveResult = await upsertEnergyDataRows([energyData]);
          
          if (saveResult.inserted > 0 || saveResult.updated > 0) {
            processedCount++;
          }

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
    };

    // Race between processing and timeout
    await Promise.race([processFiles(), timeoutPromise]);

    // Create summary sheet if we have records
    if (records.length > 0) {
      await createInvoiceExtractSummary(records);
    }

    return NextResponse.json({
      success: true,
      processedCount,
      skippedCount,
      recordsInserted: records.length,
      recordsUpdated: 0,
      foldersScanned: filesByFolder.size,
      records: records, // Return the extracted data
      dataSaved: true, // Indicate that data was saved to Google Sheets
      summaryCreated: records.length > 0, // Indicate that summary sheet was created
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
