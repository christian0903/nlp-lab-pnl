import { useRef, useState } from 'react';
import { ImagePlus, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ImageUploaderProps {
  modelId?: string;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  onInsert: (markdown: string) => void;
}

const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/jpg'];

const ImageUploader = ({ modelId, textareaRef, onInsert }: ImageUploaderProps) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Vérifier le type
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error('Seules les images PNG, JPG et JPEG sont acceptées');
      return;
    }

    // Lire la taille max depuis app_settings
    let maxSizeMb = 2;
    const { data: setting } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'max_image_size_mb')
      .single();
    if (setting?.value != null) {
      maxSizeMb = Number(setting.value);
    }

    if (file.size > maxSizeMb * 1024 * 1024) {
      toast.error(`L'image ne doit pas dépasser ${maxSizeMb} Mo`);
      return;
    }

    setUploading(true);
    const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
    const safeName = file.name
      .replace(/\.[^.]+$/, '')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .substring(0, 40);
    const folder = modelId || 'general';
    const path = `${folder}/${Date.now()}-${safeName}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('model-images')
      .upload(path, file);

    if (uploadError) {
      toast.error('Erreur lors de l\'upload');
      console.error(uploadError);
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from('model-images').getPublicUrl(path);
    const markdown = `![${safeName}](${publicUrl})`;
    onInsert(markdown);
    toast.success('Image ajoutée');
    setUploading(false);

    // Reset le file input
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        accept=".png,.jpg,.jpeg"
        className="hidden"
        onChange={handleUpload}
      />
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50"
      >
        {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <ImagePlus className="h-3 w-3" />}
        {uploading ? 'Upload...' : 'Image'}
      </button>
    </>
  );
};

export default ImageUploader;
