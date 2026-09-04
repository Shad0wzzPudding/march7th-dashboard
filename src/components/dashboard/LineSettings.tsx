import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { MessageCircle, Copy, RefreshCw, Send } from 'lucide-react';

interface LineLink {
  id: string;
  link_code: string;
  line_user_id: string | null;
  display_name: string | null;
  is_enabled: boolean;
}

const generateCode = () =>
  Array.from({ length: 8 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]).join('');

export const LineSettings = () => {
  const { toast } = useToast();
  const [link, setLink] = useState<LineLink | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    if (!userId) {
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from('line_links')
      .select('id, link_code, line_user_id, display_name, is_enabled')
      .eq('user_id', userId)
      .maybeSingle();

    if (data) {
      setLink(data as LineLink);
    } else {
      const { data: created } = await supabase
        .from('line_links')
        .insert({ user_id: userId, link_code: generateCode() })
        .select('id, link_code, line_user_id, display_name, is_enabled')
        .maybeSingle();
      if (created) setLink(created as LineLink);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const regenerate = async () => {
    if (!link) return;
    setBusy(true);
    const { data } = await supabase
      .from('line_links')
      .update({ link_code: generateCode(), line_user_id: null, display_name: null, linked_at: null })
      .eq('id', link.id)
      .select('id, link_code, line_user_id, display_name, is_enabled')
      .maybeSingle();
    if (data) setLink(data as LineLink);
    setBusy(false);
    toast({ title: 'New code generated', description: 'Send it to the bot to link again.' });
  };

  const toggleEnabled = async (value: boolean) => {
    if (!link) return;
    setLink({ ...link, is_enabled: value });
    await supabase.from('line_links').update({ is_enabled: value }).eq('id', link.id);
  };

  const sendTest = async () => {
    setBusy(true);
    const { data, error } = await supabase.functions.invoke('send-line-daily');
    setBusy(false);
    if (error) {
      toast({ title: 'Could not send', description: error.message, variant: 'destructive' });
    } else if ((data as { sent?: number })?.sent) {
      toast({ title: 'Sent!', description: "Check your LINE chat~" });
    } else {
      toast({ title: 'Nothing sent', description: 'Link your LINE account first.', variant: 'destructive' });
    }
  };

  const copyCode = () => {
    if (!link) return;
    navigator.clipboard.writeText(link.link_code);
    toast({ title: 'Copied', description: 'Link code copied to clipboard.' });
  };

  return (
    <Card className="border-2 border-dotted">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <MessageCircle size={18} className="text-primary" />
          LINE daily digest
        </CardTitle>
        <CardDescription>
          Get a LINE message every morning at 08:00 (Thai time) with the day's tasks and events — or a
          "your day is clear" note.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : !link ? (
          <p className="text-sm text-muted-foreground">Sign in to set up LINE messages.</p>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium">Status:</span>
              {link.line_user_id ? (
                <Badge className="bg-green-500/15 text-green-600 hover:bg-green-500/15">
                  Linked{link.display_name ? ` · ${link.display_name}` : ''}
                </Badge>
              ) : (
                <Badge variant="secondary">Not linked yet</Badge>
              )}
            </div>

            <div className="rounded-lg border border-dashed p-3 space-y-2">
              <p className="text-xs text-muted-foreground">
                Add the LINE bot as a friend, then send it this code in the chat:
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded-md bg-muted px-3 py-2 text-lg font-mono tracking-widest">
                  {link.link_code}
                </code>
                <Button size="icon" variant="outline" onClick={copyCode} aria-label="Copy link code">
                  <Copy size={16} />
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  onClick={regenerate}
                  disabled={busy}
                  aria-label="Generate a new link code"
                >
                  <RefreshCw size={16} />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                In the chat you can also send <b>status</b>, <b>stop</b>, or <b>start</b>.
              </p>
            </div>

            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">Daily message</p>
                <p className="text-xs text-muted-foreground">Sent at 08:00 Thai time</p>
              </div>
              <Switch checked={link.is_enabled} onCheckedChange={toggleEnabled} disabled={!link.line_user_id} />
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={sendTest}
              disabled={busy || !link.line_user_id}
            >
              <Send size={16} className="mr-2" />
              Send me today's digest now
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};
