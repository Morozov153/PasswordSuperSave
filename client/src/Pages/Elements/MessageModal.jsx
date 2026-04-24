import { useEffect } from "react";
import "./MessageModal.scss";

export default function MessageModal({
  isOpen,
  title = "Сообщение",
  message,
  onClose,
}) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-window" onClick={(event) => event.stopPropagation()}>
        <h2 className="modal-title">{title}</h2>

        <p className="modal-message">{message}</p>

        <button className="modal-button" type="button" onClick={onClose}>
          Закрыть
        </button>
      </div>
    </div>
  );
}