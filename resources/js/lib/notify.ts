import { toast } from 'sonner';
import type { ToastT } from 'sonner';

type ToastOptions = Omit<ToastT, 'id' | 'type' | 'promise'> & {
    description?: string;
};

export const notify = {
    success: (message: string, options?: ToastOptions) => {
        toast.success(message, {
            ...options,
            description: options?.description,
        });
    },

    error: (message: string, options?: ToastOptions) => {
        toast.error(message, {
            ...options,
            description: options?.description,
        });
    },

    info: (message: string, options?: ToastOptions) => {
        toast.info(message, {
            ...options,
            description: options?.description,
        });
    },

    warning: (message: string, options?: ToastOptions) => {
        toast.warning(message, {
            ...options,
            description: options?.description,
        });
    },

    loading: (message: string, options?: ToastOptions) => {
        return toast.loading(message, {
            ...options,
            description: options?.description,
        });
    },

    dismiss: (toastId?: string | number) => {
        if (toastId) {
            toast.dismiss(toastId);
        } else {
            toast.dismiss();
        }
    },

    promise: <T>(
        promise: Promise<T>,
        messages: {
            loading: string;
            success: string;
            error: string;
        },
        options?: ToastOptions,
    ) => {
        return toast.promise(promise, {
            loading: messages.loading,
            success: messages.success,
            error: messages.error,
            ...options,
        });
    },
};

export default notify;
