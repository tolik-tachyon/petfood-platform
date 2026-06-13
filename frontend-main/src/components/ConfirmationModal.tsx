import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import styles from '../styles/ConfirmationModal.module.css';

type ConfirmationModalProps = {
  isOpen: boolean;
  title: string;
  message: string;
  highlightPrimary?: string;
  highlightSecondary?: string;
  suffix?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

const ConfirmationModal = ({
  isOpen,
  title,
  message,
  highlightPrimary,
  highlightSecondary,
  suffix,
  confirmText = 'Подтвердить',
  cancelText = 'Отмена',
  onConfirm,
  onCancel,
}: ConfirmationModalProps) => {
  if (!isOpen) return null;

  return createPortal(
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.message}>
          {message}
          {highlightPrimary && <span className={styles.highlight}>{highlightPrimary}</span>}
          {suffix}
          {highlightSecondary && <span className={styles.highlight}>{highlightSecondary}</span>}
        </p>
        <div className={styles.buttons}>
          {cancelText && (
            <button onClick={onCancel} className={styles.cancelBtn}>
              {cancelText}
            </button>
          )}
          <button onClick={onConfirm} className={styles.confirmBtn}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ConfirmationModal;