import { motion, AnimatePresence, useDragControls } from "framer-motion";
import { FaTimes } from "react-icons/fa";
import { useState, useRef } from "react";

interface FormDialogTemplateProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
}

const FormDialogTemplate = ({
  isOpen,
  onClose,
  title,
  icon,
  children,
  footer,
}: FormDialogTemplateProps) => {
  const dragControls = useDragControls();
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const doubleClickRef = useRef(0);

  const handleHeaderClick = () => {
    const now = Date.now();
    if (now - doubleClickRef.current < 300) {
      // Double click detected
      setPosition({ x: 0, y: 0 });
    }
    doubleClickRef.current = now;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* الخلفية */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100001]"
            onClick={onClose}
          />

          {/* المودال المركزي */}
          <motion.div
            drag
            dragControls={dragControls}
            dragMomentum={false}
            dragElastic={0}
            dragConstraints={{ left: -window.innerWidth / 2, right: window.innerWidth / 2, top: -window.innerHeight / 2, bottom: window.innerHeight / 2 }}
            initial={{ opacity: 0, scale: 0.95, x: position.x, y: position.y }}
            animate={{ opacity: 1, scale: 1, x: position.x, y: position.y }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            onDragEnd={(_, info) => {
              setPosition({ x: position.x + info.offset.x, y: position.y + info.offset.y });
            }}
            className="
              fixed inset-0 flex items-center justify-center p-4
              z-[100002]
              cursor-move
            "
          >
            <div className="
              w-full max-w-2xl max-h-[90vh]
              bg-gradient-to-br from-slate-900/90 via-purple-900/90 to-slate-900/90
              border border-white/20
              rounded-2xl shadow-2xl
              overflow-hidden backdrop-blur-md
            ">
            {/* Header */}
            <header
              className="flex items-center justify-between p-4 border-b border-white/20 min-h-[60px] cursor-move select-none"
              onPointerDown={(e) => {
                dragControls.start(e);
                handleHeaderClick();
              }}
              onClick={handleHeaderClick}
            >
              <div className="flex items-center gap-3">
                {icon && (
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                    {icon}
                  </div>
                )}
                {title && <h2 className="text-lg font-bold text-white">{title}</h2>}
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition-colors"
              >
                <FaTimes className="w-4 h-4 text-white" />
              </button>
            </header>

            {/* Body */}
            <main className="p-4 max-h-[calc(90%-120px)] overflow-y-auto text-gray-200">
              {children}
            </main>

            {/* Footer */}
            {footer && (
              <footer className="flex items-center justify-end gap-2 p-4 border-t border-white/20 min-h-[60px]">
                {footer}
              </footer>
            )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default FormDialogTemplate;
