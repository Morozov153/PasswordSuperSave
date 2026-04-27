import { useEffect } from "react";
import "./QuestionModal.scss";

export default function QuestionModal({
  isOpen,
  title = "Вопрос",
  question,
  onYes,
  onNo,
}) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onNo();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onNo]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onNo}>
      <div className="modal-window" onClick={(event) => event.stopPropagation()}>
        <h2 className="modal-title">{title}</h2>

        <p className="modal-message">{question}</p>

        <div className="modal-actions">
          <button
            className="modal-button modal-button-yes"
            type="button"
            onClick={onYes}
          >
            Да
          </button>

          <button
            className="modal-button modal-button-no"
            type="button"
            onClick={onNo}
          >
            Нет
          </button>
        </div>
      </div>
    </div>
  );
}