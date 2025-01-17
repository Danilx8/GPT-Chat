import { useEffect } from 'react';

interface ToastProps {
  message: string;
  type: 'error' | 'success';
  onClose: () => void;
}

export default function Toast({ message, type, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className={`rounded-lg px-4 py-3 shadow-md ${
        type === 'error' ? 'bg-red-100 text-red-900' : 'bg-green-100 text-green-900'
      }`}>
        <div className="flex items-center justify-between">
          <p>{message}</p>
          <button
            onClick={onClose}
            className="ml-4 text-gray-500 hover:text-gray-700"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}