import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X, Maximize2, Minimize2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { useIsMobile } from "@/hooks/use-mobile"
import { playCancelSound } from "@/lib/sounds"

const Dialog = DialogPrimitive.Root

const DialogTrigger = DialogPrimitive.Trigger

const DialogPortal = DialogPrimitive.Portal

const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid grid-cols-[minmax(0,1fr)] auto-rows-min box-border w-[100vw] max-w-lg max-h-[92svh] overflow-y-auto overflow-x-hidden sm:w-full translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
        className
      )}
      {...props}
      onCloseAutoFocus={(e) => {
        // Keep scroll in place: don't refocus the trigger, which would
        // scroll the page back to it when the dialog closes.
        e.preventDefault();
        props.onCloseAutoFocus?.(e);
      }}
    >
      {children}
      <DialogPrimitive.Close 
        className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
      >
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
))
DialogContent.displayName = DialogPrimitive.Content.displayName

// Resizable Dialog Content with drag-to-resize functionality
interface ResizableDialogContentProps extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  defaultWidth?: number;
  defaultHeight?: number;
}

const ResizableDialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  ResizableDialogContentProps
>(({ 
  className, 
  children, 
  minWidth = 320,
  minHeight = 200,
  maxWidth = 900,
  maxHeight = 800,
  defaultWidth = 480,
  defaultHeight,
  ...props 
}, ref) => {
  const isMobile = useIsMobile();
  const [size, setSize] = React.useState({ width: defaultWidth, height: defaultHeight });
  const [isResizing, setIsResizing] = React.useState(false);
  const [resizeDirection, setResizeDirection] = React.useState<string | null>(null);
  const startPos = React.useRef({ x: 0, y: 0 });
  const startSize = React.useRef({ width: 0, height: 0 });

  const handleMouseDown = (e: React.MouseEvent, direction: string) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setResizeDirection(direction);
    startPos.current = { x: e.clientX, y: e.clientY };
    startSize.current = { width: size.width, height: size.height || 0 };
  };

  React.useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startPos.current.x;
      const deltaY = e.clientY - startPos.current.y;

      let newWidth = startSize.current.width;
      let newHeight = startSize.current.height;

      if (resizeDirection?.includes('e')) {
        newWidth = Math.min(maxWidth, Math.max(minWidth, startSize.current.width + deltaX * 2));
      }
      if (resizeDirection?.includes('w')) {
        newWidth = Math.min(maxWidth, Math.max(minWidth, startSize.current.width - deltaX * 2));
      }
      if (resizeDirection?.includes('s')) {
        newHeight = Math.min(maxHeight, Math.max(minHeight, startSize.current.height + deltaY * 2));
      }
      if (resizeDirection?.includes('n')) {
        newHeight = Math.min(maxHeight, Math.max(minHeight, startSize.current.height - deltaY * 2));
      }

      setSize({
        width: newWidth,
        height: newHeight > 0 ? newHeight : undefined,
      });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setResizeDirection(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, resizeDirection, minWidth, minHeight, maxWidth, maxHeight]);

  // Touch support for mobile
  const handleTouchStart = (e: React.TouchEvent, direction: string) => {
    e.stopPropagation();
    setIsResizing(true);
    setResizeDirection(direction);
    startPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    startSize.current = { width: size.width, height: size.height || 0 };
  };

  React.useEffect(() => {
    if (!isResizing) return;

    const handleTouchMove = (e: TouchEvent) => {
      const deltaX = e.touches[0].clientX - startPos.current.x;
      const deltaY = e.touches[0].clientY - startPos.current.y;

      let newWidth = startSize.current.width;
      let newHeight = startSize.current.height;

      if (resizeDirection?.includes('e')) {
        newWidth = Math.min(maxWidth, Math.max(minWidth, startSize.current.width + deltaX * 2));
      }
      if (resizeDirection?.includes('w')) {
        newWidth = Math.min(maxWidth, Math.max(minWidth, startSize.current.width - deltaX * 2));
      }
      if (resizeDirection?.includes('s')) {
        newHeight = Math.min(maxHeight, Math.max(minHeight, startSize.current.height + deltaY * 2));
      }
      if (resizeDirection?.includes('n')) {
        newHeight = Math.min(maxHeight, Math.max(minHeight, startSize.current.height - deltaY * 2));
      }

      setSize({
        width: newWidth,
        height: newHeight > 0 ? newHeight : undefined,
      });
    };

    const handleTouchEnd = () => {
      setIsResizing(false);
      setResizeDirection(null);
    };

    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isResizing, resizeDirection, minWidth, minHeight, maxWidth, maxHeight]);

  const resizeHandleBase = cn(
    "absolute bg-transparent hover:bg-primary/20 transition-colors z-10",
    isMobile && "hidden"
  );

  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          "fixed left-[50%] top-[50%] z-50 grid grid-cols-[minmax(0,1fr)] auto-rows-min box-border translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:rounded-lg overflow-y-auto overflow-x-hidden",
          isResizing && "select-none",
          isMobile && "!rounded-none p-4",
          className
        )}
        style={
          isMobile
            ? { width: '100vw', maxWidth: '100vw', height: 'auto', maxHeight: '92svh' }
            : { width: size.width, height: size.height, maxWidth: '95vw', maxHeight: '90vh' }
        }
        {...props}
        onCloseAutoFocus={(e) => {
          // Prevent Radix from returning focus to the trigger, which causes
          // the browser to scroll the trigger back into view and yank the
          // user away from where they were reading/editing.
          e.preventDefault();
          props.onCloseAutoFocus?.(e);
        }}
      >
        {children}
        
        {/* Close button */}
        <DialogPrimitive.Close 
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>

        {/* Resize handles */}
        {/* Right edge */}
        <div
          className={cn(resizeHandleBase, "right-0 top-2 bottom-2 w-2 cursor-ew-resize")}
          onMouseDown={(e) => handleMouseDown(e, 'e')}
          onTouchStart={(e) => handleTouchStart(e, 'e')}
        />
        {/* Left edge */}
        <div
          className={cn(resizeHandleBase, "left-0 top-2 bottom-2 w-2 cursor-ew-resize")}
          onMouseDown={(e) => handleMouseDown(e, 'w')}
          onTouchStart={(e) => handleTouchStart(e, 'w')}
        />
        {/* Bottom edge */}
        <div
          className={cn(resizeHandleBase, "bottom-0 left-2 right-2 h-2 cursor-ns-resize")}
          onMouseDown={(e) => handleMouseDown(e, 's')}
          onTouchStart={(e) => handleTouchStart(e, 's')}
        />
        {/* Top edge */}
        <div
          className={cn(resizeHandleBase, "top-0 left-2 right-2 h-2 cursor-ns-resize")}
          onMouseDown={(e) => handleMouseDown(e, 'n')}
          onTouchStart={(e) => handleTouchStart(e, 'n')}
        />
        {/* Corner: bottom-right */}
        <div
          className={cn(resizeHandleBase, "bottom-0 right-0 w-4 h-4 cursor-nwse-resize rounded-bl-sm")}
          onMouseDown={(e) => handleMouseDown(e, 'se')}
          onTouchStart={(e) => handleTouchStart(e, 'se')}
        >
          <div className="absolute bottom-1 right-1 w-2 h-2 border-r-2 border-b-2 border-muted-foreground/30" />
        </div>
        {/* Corner: bottom-left */}
        <div
          className={cn(resizeHandleBase, "bottom-0 left-0 w-4 h-4 cursor-nesw-resize rounded-br-sm")}
          onMouseDown={(e) => handleMouseDown(e, 'sw')}
          onTouchStart={(e) => handleTouchStart(e, 'sw')}
        />
        {/* Corner: top-right */}
        <div
          className={cn(resizeHandleBase, "top-0 right-0 w-4 h-4 cursor-nesw-resize rounded-bl-sm")}
          onMouseDown={(e) => handleMouseDown(e, 'ne')}
          onTouchStart={(e) => handleTouchStart(e, 'ne')}
        />
        {/* Corner: top-left */}
        <div
          className={cn(resizeHandleBase, "top-0 left-0 w-4 h-4 cursor-nwse-resize rounded-br-sm")}
          onMouseDown={(e) => handleMouseDown(e, 'nw')}
          onTouchStart={(e) => handleTouchStart(e, 'nw')}
        />
      </DialogPrimitive.Content>
    </DialogPortal>
  );
})
ResizableDialogContent.displayName = "ResizableDialogContent"

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
DialogHeader.displayName = "DialogHeader"

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
)
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  ResizableDialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
