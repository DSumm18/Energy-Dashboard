import { NextRequest, NextResponse } from 'next/server';
import { syncInvoicesFromDrive } from '@/lib/invoice-processing';

export async function POST(request: NextRequest) {
  try {
    const { folderId } = await request.json().catch(() => ({}));
    
    // Temporarily override the environment variable if folderId is provided
    if (folderId) {
      process.env.GOOGLE_DRIVE_INVOICE_FOLDER_ID = folderId;
    }
    
    const summary = await syncInvoicesFromDrive();
    return NextResponse.json({ success: true, summary });
  } catch (error: any) {
    console.error('Drive sync failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Failed to process Drive invoices',
      },
      { status: 500 }
    );
  }
}
