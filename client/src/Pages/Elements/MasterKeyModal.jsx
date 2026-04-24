import { useEffect, useRef } from "react";

export default function MasterKeyModal({
  value,
  onChange,
  onConfirm,
  onCancel,
  disabled,
}) {
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function handleSubmit(e) {
    e.preventDefault();

    if (!disabled) {
      onConfirm();
    }
  }

  return (
    <div className="modal">
      <form className="modal__content" onSubmit={handleSubmit}>
        <p>Введите мастер-ключ, чтобы посмотреть данные</p>

        <input
          ref={inputRef}
          className="input"
          type="password"
          placeholder="Мастер-ключ"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              onCancel();
            }
          }}
        />

        <div className="modal__actions">
          <button
            type="submit"
            className="btn btn--primary"
            style={{ width: 120 }}
            disabled={disabled}
          >
            Проверить
          </button>

          <button
            type="button"
            className="btn"
            style={{ width: 100 }}
            onClick={onCancel}
          >
            Отмена
          </button>
        </div>
      </form>
    </div>
  );
}