import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { getServiceAccountAuth } from '@/lib/google-auth';

const DRIVE_SCOPES = ['https://www.googleapis.com/auth/drive.readonly'];

export async function POST(request: NextRequest) {
  try {
    const { parentId } = await request.json().catch(() => ({}));

    const auth = await getServiceAccountAuth(DRIVE_SCOPES);
    const drive = google.drive({ version: 'v3', auth });

    const query = parentId 
      ? `'${parentId}' in parents and trashed = false`
      : `'root' in parents and trashed = false`;

    const response = await drive.files.list({
      q: query,
      fields: 'files(id,name,mimeType,parents)',
      orderBy: 'name',
    });

    const folders = (response.data.files || [])
      .filter(file => file.mimeType === 'application/vnd.google-apps.folder')
      .map(file => ({
        id: file.id!,
        name: file.name || 'Unnamed Folder',
        mimeType: file.mimeType!,
        parents: file.parents,
      }));

    return NextResponse.json({
      success: true,
      folders,
    });
  } catch (error: any) {
    console.error('Error fetching Drive folders:', error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Failed to fetch Google Drive folders',
      },
      { status: 500 }
    );
  }
}
