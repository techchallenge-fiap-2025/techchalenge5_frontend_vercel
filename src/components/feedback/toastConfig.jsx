import React from "react";
import { toast } from "react-toastify";
import { ErrorToast } from "./ErrorToast";
import { WarningToast } from "./WarningToast";
import { SuccessToast } from "./SuccessToast";
import { InfoToast } from "./InfoToast";
import { ConfirmDeleteToast } from "./ConfirmDeleteToast";

/**
 * Toast de erro customizado
 * @param {string} message - Mensagem de erro
 */
export const showErrorToast = (message = "❌ Erro ao tentar fazer login") => {
  toast.error(<ErrorToast message={message} />, {
    position: "top-center",
    autoClose: 1500,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    className: "toast-error-custom",
    bodyClassName: "toast-error-body",
    progressClassName: "toast-error-progress",
    icon: false, // Desabilitar ícone padrão para usar o customizado
  });
};

/**
 * Toast de sucesso customizado
 * @param {string} message - Mensagem de sucesso (opcional)
 */
export const showSuccessToast = (message = "✅ Logado com sucesso") => {
  toast.success(<SuccessToast message={message} />, {
    position: "top-center",
    autoClose: 1500,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    className: "toast-success-custom",
    bodyClassName: "toast-success-body",
    progressClassName: "toast-success-progress",
    icon: false, // Desabilitar ícone padrão para usar o customizado
  });
};

/**
 * Toast de aviso customizado
 * @param {string} message - Mensagem de aviso
 */
export const showWarningToast = (message = "⚠️ Algum campo está faltando") => {
  toast.warning(<WarningToast message={message} />, {
    position: "top-center",
    autoClose: 1500,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    className: "toast-warning-custom",
    bodyClassName: "toast-warning-body",
    progressClassName: "toast-warning-progress",
    icon: false, // Desabilitar ícone padrão para usar o customizado
  });
};

/**
 * Toast de informação customizado
 * @param {string} message - Mensagem de informação
 */
export const showInfoToast = (message) => {
  toast.info(<InfoToast message={message} />, {
    position: "top-center",
    autoClose: 1500,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    className: "toast-info-custom",
    bodyClassName: "toast-info-body",
    progressClassName: "toast-info-progress",
    icon: false, // Desabilitar ícone padrão para usar o customizado
  });
};

/**
 * Toast de confirmação de deleção customizado
 * @param {string} message - Mensagem de confirmação
 * @param {Function} onConfirm - Callback para quando confirmar
 * @param {Function} onCancel - Callback para quando cancelar
 */
export const showConfirmDeleteToast = (message, onConfirm, onCancel) => {
  const toastId = toast.info(
    <ConfirmDeleteToast
      message={message}
      onConfirm={() => {
        toast.dismiss(toastId);
        onConfirm();
      }}
      onCancel={() => {
        toast.dismiss(toastId);
        onCancel();
      }}
    />,
    {
      position: "top-center",
      autoClose: false, // Não fechar automaticamente
      hideProgressBar: true,
      closeOnClick: false,
      pauseOnHover: true,
      draggable: false,
      className: "toast-info-custom",
      bodyClassName: "toast-info-body",
      progressClassName: "toast-info-progress",
      icon: false,
    },
  );
};
