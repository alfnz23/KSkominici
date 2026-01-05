import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { report_id } = body;

    if (!report_id) {
      return NextResponse.json(
        { error: 'report_id is required' },
        { status: 400 }
      );
    }

    console.log('🗑️ Deleting documents for report:', report_id);

    // Get documents to delete from storage
    const { data: documents } = await supabase
      .from('documents')
      .select('storage_path')
      .eq('report_id', report_id);

    // Delete files from storage
    if (documents && documents.length > 0) {
      for (const doc of documents) {
        if (doc.storage_path) {
          await supabase.storage
            .from('documents')
            .remove([doc.storage_path]);
        }
      }
      console.log(`🗑️ Deleted ${documents.length} files from storage`);
    }

    // Delete document records from database
    const { error: deleteError } = await supabase
      .from('documents')
      .delete()
      .eq('report_id', report_id);

    if (deleteError) {
      console.error('❌ Delete error:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete documents', details: deleteError },
        { status: 500 }
      );
    }

    console.log('✅ Documents deleted successfully');

    return NextResponse.json(
      { 
        success: true,
        message: 'Documents deleted successfully'
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Error deleting documents:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
