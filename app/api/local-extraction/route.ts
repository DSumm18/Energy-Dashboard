import { NextRequest, NextResponse } from 'next/server';
import { extractInvoiceFromBuffer } from '@/lib/invoice-extraction';
import type { ExtractedInvoiceRecord, TransformedEnergyRecord } from '@/types';
import { isFileProcessed, markFileAsProcessed, createExtractionSheet, saveExtractionToSheet } from '@/lib/google-sheets';
import { saveExtractionRun } from '@/lib/local-database';

// Transform extracted invoice data to energy data format
function transformInvoiceToEnergyData(extracted: ExtractedInvoiceRecord): TransformedEnergyRecord {
  // Parse the invoice period to get year and month
  const periodMatch = extracted.invoicePeriod.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  const year = periodMatch ? parseInt(periodMatch[3]) : new Date().getFullYear();
  const month = periodMatch ? getMonthName(parseInt(periodMatch[2])) : 'Unknown';

  // Determine energy type based on supplier or other indicators
  const energyType = extracted.supplier.toLowerCase().includes('gas') ? 'Gas' : 'Electricity';

  // Handle credit notes differently
  const isCreditNote = extracted.documentType === 'Credit Note' || 
                      extracted.sourceFileName.toLowerCase().includes('credit') ||
                      extracted.totalAmount < 0;

  return {
    schoolName: extracted.siteName,
    meterNumber: extracted.meterSerial || extracted.mprn || 'Unknown',
    energyType,
    year,
    month,
    // For credit notes, don't count energy consumption (it's an adjustment, not actual usage)
    totalKwh: isCreditNote ? 0 : extracted.energyConsumed,
    // Credit notes should have negative amounts to reduce total cost
    totalCost: isCreditNote ? Math.abs(extracted.totalAmount) * -1 : extracted.totalAmount,
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
    };

    // Race between processing and timeout
    await Promise.race([processFiles(), timeoutPromise]);

    // Check credentials
    const hasGeminiKey = Boolean(process.env.GENAI_API_KEY || process.env.GEMINI_API_KEY);
    const hasServiceAccount = Boolean(
      process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && 
      process.env.GOOGLE_PRIVATE_KEY
    );

    // Always save to local database first
    let localDatabaseRun = null;
    let saveStatus = 'not-attempted';

    if (records.length > 0) {
      try {
        // Save to local database
        localDatabaseRun = await saveExtractionRun(
          records,
          processedCount,
          skippedCount,
          errors,
          `Local Extract ${new Date().toLocaleDateString()}`
        );
        saveStatus = 'saved-to-local-database';
        console.log('✅ Data saved to local database');

        // Try to save to Google Sheets if we have service account
        if (hasServiceAccount) {
          try {
            const newSheetId = await createExtractionSheet(records);
            const sheetName = `Energy Extract ${new Date().toISOString().split('T')[0]}`;
            await saveExtractionToSheet(newSheetId, records);
            saveStatus = 'saved-to-both-local-and-sheets';
            console.log('✅ Data also saved to Google Sheets');
          } catch (error) {
            console.error('Error saving to sheets:', error);
            saveStatus = 'saved-to-local-database-only';
          }
        } else {
          saveStatus = 'saved-to-local-database-only';
          console.log('⚠️ Data saved to local database only (need service account for Google Sheets)');
        }
      } catch (error) {
        console.error('Error saving to local database:', error);
        saveStatus = 'save-failed';
      }
    }

    // Create a summary of extracted data for immediate viewing
    const extractedSummary = records.map(record => {
      const isCreditNote = record.documentType === 'Credit Note' || 
                          record.sourceFileName.toLowerCase().includes('credit') ||
                          record.totalAmount < 0;
      
      return {
        fileName: record.sourceFileName,
        school: record.siteName,
        supplier: record.supplier,
        documentType: record.documentType,
        invoicePeriod: record.invoicePeriod,
        totalAmount: record.totalAmount,
        energyConsumed: isCreditNote ? 0 : record.energyConsumed, // Credit notes = 0 kWh
        meterSerial: record.meterSerial,
        mprn: record.mprn,
        isCreditNote,
        processedCorrectly: isCreditNote ? 'Credit note (no energy consumption)' : 'Invoice (energy consumption recorded)'
      };
    });

    return NextResponse.json({
      success: true,
      processedCount,
      skippedCount,
      recordsInserted: records.length,
      recordsUpdated: 0,
      foldersScanned: filesByFolder.size,
      records: records, // Full extracted data
      extractedSummary, // ← This will show you exactly what was extracted!
      dataSaved: saveStatus.includes('saved'),
      saveStatus,
      hasServiceAccount,
      hasGeminiKey,
      localDatabaseRun: localDatabaseRun ? {
        id: localDatabaseRun.id,
        name: localDatabaseRun.name,
        timestamp: localDatabaseRun.timestamp,
        recordCount: localDatabaseRun.recordCount
      } : null,
      credentialStatus: {
        geminiAI: hasGeminiKey ? 'available' : 'missing',
        serviceAccount: hasServiceAccount ? 'available' : 'missing',
        canExtract: hasGeminiKey,
        canSaveToSheets: hasServiceAccount,
        localDatabase: 'available'
      },
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