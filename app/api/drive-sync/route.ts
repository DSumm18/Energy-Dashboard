import { NextResponse } from 'next/server';
import { syncInvoicesFromDrive } from '@/lib/invoice-processing';

export async function POST() {
  try {
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
