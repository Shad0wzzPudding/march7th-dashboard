import { useState, useEffect } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import march7thExcited from '@/assets/march7th-excited.png';
import march7thWinking from '@/assets/march7th-winking.png';
import { playMarchSound, playConfirmSound, playCancelSound } from '@/lib/sounds';

interface MarchConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
}

const handleConfirmClick = (onConfirm: () => void) => {
  playConfirmSound();
  onConfirm();
};

// Cancel button just closes the dialog - sound is handled by handleOpenChange
const handleCancelClick = (onOpenChange: (open: boolean) => void) => {
  onOpenChange(false);
};

const marchMessages = [
  { text: "Whoa, wait a second!", sticker: march7thExcited },
  { text: "Hold up, Trailblazer!", sticker: march7thWinking },
  { text: "Are you really sure??", sticker: march7thExcited },
];

export const MarchConfirmDialog = ({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  confirmText = "Yes, I'm sure!",
  cancelText = "Nevermind~"
}: MarchConfirmDialogProps) => {
  const [marchMessage] = useState(() => {
    return marchMessages[Math.floor(Math.random() * marchMessages.length)];
  });

  // Play sound when dialog opens
  useEffect(() => {
    if (open) {
      playMarchSound();
    }
  }, [open]);

  // Intercept all close attempts (clicking outside, pressing Escape, etc.)
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && open) {
      // Dialog is being closed - play cancel sound
      playCancelSound();
    }
    onOpenChange(newOpen);
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-950/40 dark:to-purple-950/40 border-2 border-pink-200 dark:border-pink-800 max-w-md">
        <AlertDialogHeader className="text-center">
          <div className="flex justify-center mb-2">
            <img 
              src={marchMessage.sticker} 
              alt="March 7th" 
              className="w-20 h-20 object-contain animate-bounce"
            />
          </div>
          <AlertDialogTitle className="text-xl bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent font-bold">
            {marchMessage.text}
          </AlertDialogTitle>
          <div className="py-3">
            <p className="text-base font-semibold text-pink-700 dark:text-pink-300">
              {title}
            </p>
            <AlertDialogDescription className="text-sm text-pink-600/80 dark:text-pink-400/80 mt-2">
              {description}
            </AlertDialogDescription>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <Button 
            variant="outline"
            onClick={() => handleCancelClick(onOpenChange)}
            className="w-full sm:w-auto bg-white dark:bg-gray-800 border-pink-200 dark:border-pink-700 text-pink-600 dark:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-950/50"
          >
            {cancelText}
          </Button>
          <AlertDialogAction
            onClick={() => handleConfirmClick(onConfirm)}
            className="w-full sm:w-auto bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-semibold"
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};