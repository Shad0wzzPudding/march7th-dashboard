import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Attachment } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Paperclip, X, Loader2, FileText, Image as ImageIcon, Download, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

const MAX_SIZE = 25 * 1024 * 1024; // 25MB

function iconFor(type: string) {
  if (type.startsWith('image/')) return <ImageIcon size={12} />;
  return <FileText size={12} />;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

export async function openAttachment(a: Attachment) {
  const { data, error } = await supabase.storage
    .from('attachments')
    .createSignedUrl(a.path, 60);
  if (error || !data?.signedUrl) {
    toast.error('Failed to open attachment');
    return;
  }
  window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
}

export function isImageAttachment(a: Attachment) {
  return typeof a.type === 'string' && a.type.startsWith('image/');
}

export function isDisplayed(a: Attachment) {
  return isImageAttachment(a) && Number(a.display) === 1;
}

interface AttachmentsFieldProps {
  value: Attachment[];
  onChange: (next: Attachment[]) => void;
}

export function AttachmentsField({ value, onChange }: AttachmentsFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const uploaded: Attachment[] = [];
      for (const file of Array.from(files)) {
        if (file.size > MAX_SIZE) {
          toast.error(`${file.name} exceeds 25MB`);
          continue;
        }
        const safeName = file.name.replace(/[^\w.\-]+/g, '_');
        const path = `${user.id}/${crypto.randomUUID()}-${safeName}`;
        const { error } = await supabase.storage
          .from('attachments')
          .upload(path, file, { contentType: file.type, upsert: false });
        if (error) {
          toast.error(`Upload failed: ${file.name}`);
          continue;
        }
        uploaded.push({
          path,
          name: file.name,
          type: file.type || 'application/octet-stream',
          size: file.size,
        });
      }
      if (uploaded.length > 0) onChange([...(value || []), ...uploaded]);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleRemove = async (a: Attachment) => {
    onChange(value.filter((x) => x.path !== a.path));
    // Best-effort delete from storage
    await supabase.storage.from('attachments').remove([a.path]);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Attachments</label>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? <Loader2 size={12} className="mr-1 animate-spin" /> : <Paperclip size={12} className="mr-1" />}
          Add file
        </Button>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((a) => (
            <div
              key={a.path}
              className="flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-2 py-1 text-xs max-w-full"
            >
              {iconFor(a.type)}
              <button
                type="button"
                onClick={() => openAttachment(a)}
                className="truncate max-w-[140px] hover:underline"
                title={a.name}
              >
                {a.name}
              </button>
              <span className="text-muted-foreground">{formatSize(a.size)}</span>
              {isImageAttachment(a) && (
                <button
                  type="button"
                  onClick={() =>
                    onChange(
                      value.map((x) =>
                        x.path === a.path ? { ...x, display: isDisplayed(x) ? 0 : 1 } : x,
                      ),
                    )
                  }
                  className={isDisplayed(a) ? 'text-main-focus' : 'text-muted-foreground hover:text-foreground'}
                  title={isDisplayed(a) ? 'Hide inline preview' : 'Show inline preview'}
                  aria-label="Toggle inline display"
                >
                  {isDisplayed(a) ? <Eye size={12} /> : <EyeOff size={12} />}
                </button>
              )}
              <button
                type="button"
                onClick={() => handleRemove(a)}
                className="text-muted-foreground hover:text-destructive"
                aria-label="Remove"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface AttachmentsChipsProps {
  attachments?: Attachment[];
}

export function AttachmentsChips({ attachments }: AttachmentsChipsProps) {
  if (!attachments || attachments.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5" onClick={(e) => e.stopPropagation()}>
      {attachments.map((a) => (
        <button
          key={a.path}
          type="button"
          onClick={() => openAttachment(a)}
          title={`${a.name} (${formatSize(a.size)})`}
          className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/40 px-2 py-0.5 text-xs hover:bg-muted"
        >
          {iconFor(a.type)}
          <span className="truncate max-w-[120px]">{a.name}</span>
          <Download size={10} className="text-muted-foreground" />
        </button>
      ))}
    </div>
  );
}

interface AttachmentsImagesProps {
  attachments?: Attachment[];
}

export function AttachmentsImages({ attachments }: AttachmentsImagesProps) {
  const shown = (attachments || []).filter(isDisplayed);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const key = shown.map((a) => a.path).join('|');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const next: Record<string, string> = {};
      for (const a of shown) {
        const { data } = await supabase.storage
          .from('attachments')
          .createSignedUrl(a.path, 3600);
        if (data?.signedUrl) next[a.path] = data.signedUrl;
      }
      if (!cancelled) setUrls(next);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  if (shown.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
      {shown.map((a) => (
        <button
          key={a.path}
          type="button"
          onClick={() => openAttachment(a)}
          className="block rounded-md overflow-hidden border border-border bg-muted/40 hover:opacity-90 transition-opacity"
          title={String(a.name)}
        >
          {urls[a.path] ? (
            <img
              src={urls[a.path]}
              alt={String(a.name)}
              className="max-h-48 max-w-full object-contain"
              loading="lazy"
            />
          ) : (
            <div className="w-32 h-24 flex items-center justify-center text-xs text-muted-foreground">
              Loading…
            </div>
          )}
        </button>
      ))}
    </div>
  );
}