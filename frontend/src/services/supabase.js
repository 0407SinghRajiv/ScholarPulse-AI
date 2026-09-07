import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://jzyhoezvlfrjfgaaaqix.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

/**
 * Uploads a user's PDF to Supabase Storage bucket 'research-papers'
 * Path pattern: {userId}/{timestamp}_{cleanFilename}
 */
export async function uploadPaperToStorage(userId, file) {
  if (!userId || !file) {
    throw new Error('User ID and File are required for storage upload');
  }

  const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const filePath = `${userId}/${Date.now()}_${cleanName}`;

  const { data, error } = await supabase.storage
    .from('research-papers')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    console.warn('Supabase storage upload error:', error.message);
    // If bucket doesn't exist yet, we still allow local analysis to proceed gracefully
    return { path: null, error };
  }

  return { path: data?.path || filePath, error: null };
}

/**
 * Retrieves a signed URL or public URL for a user's stored paper
 */
export async function getPaperSignedUrl(filePath, expiresIn = 3600) {
  if (!filePath) return null;
  const { data, error } = await supabase.storage
    .from('research-papers')
    .createSignedUrl(filePath, expiresIn);

  if (error) {
    console.warn('Failed to get signed URL:', error.message);
    return null;
  }
  return data?.signedUrl;
}

/**
 * Downloads a paper as a Blob directly from Supabase Storage
 */
export async function downloadPaperBlob(filePath) {
  if (!filePath) return null;
  const { data, error } = await supabase.storage
    .from('research-papers')
    .download(filePath);

  if (error) {
    console.warn('Failed to download paper blob:', error.message);
    return null;
  }
  return data;
}

/**
 * Saves analysis record to Supabase DB 'analyses' table
 */
export async function saveAnalysisRecord({
  userId,
  fileName,
  filePath,
  fileSizeBytes,
  pageCount,
  complexityScore,
  readTimeMins,
  summary,
  fullResult,
}) {
  if (!userId) return null;

  try {
    const payload = {
      user_id: userId,
      file_name: fileName,
      file_path: filePath,
      file_size_bytes: fileSizeBytes || 0,
      page_count: pageCount || 1,
      complexity_score: complexityScore || 65,
      estimated_read_time_mins: readTimeMins || 5,
      summary: summary || '',
      full_result: fullResult,
    };

    let { data, error } = await supabase
      .from('analyses')
      .insert([payload])
      .select()
      .single();

    if (error && error.message && error.message.includes('file_name')) {
      delete payload.file_name;
      payload.filename = fileName;
      const retry = await supabase
        .from('analyses')
        .insert([payload])
        .select()
        .single();
      data = retry.data;
      error = retry.error;
    }

    if (error) {
      console.warn('Failed to save analysis to cloud DB:', error.message);
      saveLocalBackupAnalysis(userId, {
        id: 'local_' + Date.now(),
        user_id: userId,
        file_name: fileName,
        file_path: filePath,
        file_size_bytes: fileSizeBytes,
        page_count: pageCount,
        complexity_score: complexityScore,
        estimated_read_time_mins: readTimeMins,
        summary,
        full_result: fullResult,
        created_at: new Date().toISOString(),
      });
      return null;
    }

    return data;
  } catch (err) {
    console.warn('Error in saveAnalysisRecord:', err);
    return null;
  }
}

/**
 * Fetches user analyses from Supabase DB, with fallback to local storage
 */
export async function getUserAnalyses(userId) {
  if (!userId) return [];

  try {
    const { data, error } = await supabase
      .from('analyses')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error || !data) {
      console.warn('Error fetching from analyses table, checking local backup:', error?.message);
      return getLocalBackupAnalyses(userId);
    }

    // Merge any local backups that aren't yet synced
    const local = getLocalBackupAnalyses(userId);
    const existingIds = new Set(data.map((d) => d.id));
    const merged = [...data, ...local.filter((l) => !existingIds.has(l.id))];
    return merged.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  } catch (err) {
    console.warn('Exception fetching user analyses:', err);
    return getLocalBackupAnalyses(userId);
  }
}

/**
 * Deletes an analysis record
 */
export async function deleteAnalysisRecord(id, filePath) {
  try {
    if (filePath) {
      await supabase.storage.from('research-papers').remove([filePath]);
    }
    await supabase.from('analyses').delete().eq('id', id);
    removeLocalBackupAnalysis(id);
    return true;
  } catch (err) {
    console.warn('Failed to delete analysis record:', err);
    return false;
  }
}

// Local storage backup helpers
function getLocalBackupAnalyses(userId) {
  try {
    const raw = localStorage.getItem(`scholarpulse_analyses_${userId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalBackupAnalysis(userId, record) {
  try {
    const existing = getLocalBackupAnalyses(userId);
    const updated = [record, ...existing.filter((r) => r.id !== record.id)];
    localStorage.setItem(`scholarpulse_analyses_${userId}`, JSON.stringify(updated.slice(0, 50)));
  } catch (e) {
    console.warn('Local storage backup save error:', e);
  }
}

function removeLocalBackupAnalysis(id) {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('scholarpulse_analyses_')) {
        const list = JSON.parse(localStorage.getItem(key) || '[]');
        const filtered = list.filter((r) => r.id !== id);
        localStorage.setItem(key, JSON.stringify(filtered));
      }
    }
  } catch (e) {
    console.warn('Local storage backup delete error:', e);
  }
}
