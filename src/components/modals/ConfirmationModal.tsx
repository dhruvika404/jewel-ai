import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

type ActionType = 'edit' | 'view' | 'delete'

interface ConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title?: string
  modalTitle?: string
  submitButtonText?: string
  cancelButtonText?: string
  isCloseButton?: boolean
  isConfirmLoading?: boolean
  actionType?: ActionType
}

export default function ConfirmationModal({
  isCloseButton = true,
  modalTitle = 'Are you sure?',
  submitButtonText = 'Confirm',
  cancelButtonText = 'Cancel',
  title,
  onClose,
  isOpen,
  onConfirm,
  isConfirmLoading = false,
  actionType = 'delete',
}: ConfirmationModalProps) {

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[90%] max-w-[500px] p-5 sm:p-7 rounded-xl">
          <DialogTitle className="text-lg sm:text-xl font-semibold text-foreground text-center">
          {modalTitle}
        </DialogTitle>

        {title && (
          <p className="text-base font-medium text-muted-foreground text-center mb-3">
            {title}
          </p>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-5 mt-4">
          {isCloseButton && (
            <Button
              variant="outline"
              onClick={onClose}
              className="w-full px-[30px] sm:w-auto h-[48px] text-base"
            >
              {cancelButtonText}
            </Button>
          )}
          <Button
            onClick={onConfirm}
            disabled={isConfirmLoading}
            variant="destructive"
            className={actionType === 'delete' ? 'h-[48px] px-[30px] text-base' : 'h-[48px] w-[48px]'}
          >
           {submitButtonText}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
