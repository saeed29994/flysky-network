// src/components/admin/FormDialogDelete.tsx
import { FaTrash } from "react-icons/fa";
import FormDialogTemplate from "./FormDialogTemplate";

interface FormDialogDeleteProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName?: string;
}

const FormDialogDelete = ({ isOpen, onClose, onConfirm, itemName }: FormDialogDeleteProps) => {
  return (
    <FormDialogTemplate
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Confirmation"
      icon={<FaTrash className="w-5 h-5 text-white" />}
      footer={
        <>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            Delete
          </button>
        </>
      }
    >
      <p className="text-sm text-gray-300">
        Are you sure you want to delete{" "}
        <span className="text-white font-semibold">{itemName || "this item"}</span>?
        This action cannot be undone.
      </p>
    </FormDialogTemplate>
  );
};

export default FormDialogDelete;
