import { useState, useEffect, useRef } from 'react';
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
import march7thHappy from '@/assets/march7th-happy.png';
import march7thCandy from '@/assets/march7th-candy.png';
import march7thProud from '@/assets/march7th-proud.png';
import march7thWelcoming from '@/assets/march7th-welcoming.png';
import march7thConfident from '@/assets/march7th-confident.png';
import march7thTg04 from '@/assets/march7th-tg-04.webp';
import march7thTg05 from '@/assets/march7th-tg-05.webp';
import march7thTg06 from '@/assets/march7th-tg-06.webp';
import march7thTg07 from '@/assets/march7th-tg-07.webp';
import march7thTg10 from '@/assets/march7th-tg-10.webp';
import march7thTg11 from '@/assets/march7th-tg-11.webp';
import march7thTg12 from '@/assets/march7th-tg-12.webp';
import march7thTg13 from '@/assets/march7th-tg-13.webp';
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
  { text: "Eep! Think it through, okay?", sticker: march7thHappy },
  { text: "Wait wait wait — sweet treat first?", sticker: march7thCandy },
  { text: "Trust me, double-check this one!", sticker: march7thProud },
  { text: "Heyy, are we really doing this?", sticker: march7thWelcoming },
  { text: "Hmph, I hope you know what you're doing!", sticker: march7thConfident },
  { text: "Make a wish before you decide~", sticker: march7thTg04 },
  { text: "Snack break first? ...No? Okay then!", sticker: march7thTg05 },
  { text: "Hmph! Don't blame me if you regret it!", sticker: march7thTg06 },
  { text: "Pretty please, think it over again?", sticker: march7thTg07 },
  { text: "Ehehe, last chance to back out!", sticker: march7thTg10 },
  { text: "Vacation later — decide first!", sticker: march7thTg11 },
  { text: "Waaah, this is a scary choice!", sticker: march7thTg12 },
  { text: "Staring at you... are you sure?", sticker: march7thTg13 },
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
  const justConfirmedRef = useRef(false);

  // Play sound when dialog opens
  useEffect(() => {
    if (open) {
      playMarchSound();
    }
  }, [open]);

  // Intercept all close attempts (clicking outside, pressing Escape, etc.)
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && open) {
      // Dialog is being closed - play cancel sound,
      // unless we just confirmed (confirm sound already played).
      if (justConfirmedRef.current) {
        justConfirmedRef.current = false;
      } else {
        playCancelSound();
      }
    }
    onOpenChange(newOpen);
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-950/40 dark:to-purple-950/40 border-2 border-pink-200 dark:border-pink-800 max-w-md w-[calc(100vw-2rem)] [&>*]:min-w-0">
        <AlertDialogHeader className="text-center min-w-0">
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
          <div className="py-3 min-w-0 w-full">
            <p className="text-base font-semibold text-pink-700 dark:text-pink-300 break-all">
              {title}
            </p>
            <AlertDialogDescription className="text-sm text-pink-600/80 dark:text-pink-400/80 mt-2 break-all max-h-40 overflow-y-auto">
              {description}
            </AlertDialogDescription>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <Button 
            variant="outline"
            type="button"
            onClick={() => {
              console.log("Cancel button onClick fired");
              playCancelSound();
              onOpenChange(false);
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              console.log("Cancel button onTouchEnd fired");
              playCancelSound();
              onOpenChange(false);
            }}
            className="w-full sm:w-auto bg-white dark:bg-gray-800 border-pink-200 dark:border-pink-700 text-pink-600 dark:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-950/50"
          >
            {cancelText}
          </Button>
          <AlertDialogAction
            onClick={() => {
              justConfirmedRef.current = true;
              handleConfirmClick(onConfirm);
            }}
            className="w-full sm:w-auto bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-semibold"
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};