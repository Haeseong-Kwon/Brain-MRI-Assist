import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const uploadMRIFile = async (file: File, patientId: string) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${patientId}/${Date.now()}.${fileExt}`;
    const filePath = `scans/${fileName}`;

    const { data, error } = await supabase.storage
        .from('mri-files')
        .upload(filePath, file);

    if (error) {
        throw error;
    }

    return data;
};

export const getMRIFileUrl = (path: string) => {
    const { data } = supabase.storage
        .from('mri-files')
        .getPublicUrl(path);

    return data.publicUrl;
};
