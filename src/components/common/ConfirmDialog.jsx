import { useRef } from 'react';
import Dialog from './Dialog';

export default function ConfirmDialog({ open, title, description, confirmLabel = 'Confirm', cancelLabel = 'Cancel', destructive, onConfirm, onCancel }) {
  // Focus "Cancel" first so a stray Enter never deletes anything.
  const cancelRef = useRef(null);
  return (
    <Dialog open={open} onClose={onCancel} title={title} description={description} initialFocusRef={cancelRef}>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button
          ref={cancelRef}
          type="button"
          onClick={onCancel}
          className="h-11 rounded-lg border border-line px-4 text-sm font-medium hover:bg-surface-2"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className={`h-11 rounded-lg px-4 text-sm font-semibold text-white ${
            destructive ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {confirmLabel}
        </button>
      </div>
    </Dialog>
  );
}
