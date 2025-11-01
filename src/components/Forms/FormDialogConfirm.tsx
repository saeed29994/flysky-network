// src/components/admin/FormDialogConfirm.tsx
import { FaCheckCircle } from "react-icons/fa";
import FormDialogTemplate from "./FormDialogTemplate";

interface FormDialogConfirmProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
}

const FormDialogConfirm = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message = "Are you sure you want to proceed?",
}: FormDialogConfirmProps) => {
  return (
    <FormDialogTemplate
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      icon={<FaCheckCircle className="w-5 h-5 text-white" />}
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
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
          >
            Confirm
          </button>
        </>
      }
    >
      <p className="text-sm text-gray-300">{message}</p>
    </FormDialogTemplate>
  );
};

export default FormDialogConfirm;
