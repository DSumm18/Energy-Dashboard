import { NextRequest, NextResponse } from 'next/server';
import { 
  getAllExtractionRuns, 
  getCurrentExtractionRun, 
  setCurrentRun, 
  deleteExtractionRun,
  getDatabaseStats 
} from '@/lib/local-database';

// GET - List all extraction runs
export async function GET() {
  try {
    const runs = await getAllExtractionRuns();
    const currentRun = await getCurrentExtractionRun();
    const stats = await getDatabaseStats();

    return NextResponse.json({
      success: true,
      runs,
      currentRun,
      stats
    });
  } catch (error) {
    console.error('Error fetching extraction runs:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch extraction runs' 
      },
      { status: 500 }
    );
  }
}

// POST - Set current extraction run
export async function POST(request: NextRequest) {
  try {
    const { runId } = await request.json();

    if (!runId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'runId is required' 
        },
        { status: 400 }
      );
    }

    const success = await setCurrentRun(runId);
    
    if (!success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Run not found' 
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Current run updated successfully'
    });
  } catch (error) {
    console.error('Error setting current run:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to set current run' 
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete extraction run
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const runId = searchParams.get('runId');

    if (!runId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'runId is required' 
        },
        { status: 400 }
      );
    }

    const success = await deleteExtractionRun(runId);
    
    if (!success) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Run not found' 
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Run deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting run:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete run' 
      },
      { status: 500 }
    );
  }
}
