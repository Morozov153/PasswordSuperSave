import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import "./MainPage.scss";

import closeIcon from "../../image/closePassword.png";
import openIcon from "../../image/openPassword.png";
import editIcon from "../../image/editButton.png";

import MasterKeyModal from "../Elements/MasterKeyModal";

export default function MainPage() {
  const location = useLocation();
  const user = location.state?.user;

  const emptyItem = {
    title: "",
    login: "",
    password: "",
    notes: "",
    updated_at: "",
    needMasterKey: false,
  };

  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("");
  const [confirmId, setConfirmId] = useState(null);
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState("");
  const [revealId, setRevealId] = useState(null);
  const [newItem, setNewItem] = useState(emptyItem);

  const [masterModalId, setMasterModalId] = useState(null);
  const [masterKeyInput, setMasterKeyInput] = useState("");
  const [unlockedIds, setUnlockedIds] = useState([]);

  const notesRef = useRef(null);
  const flashTimerRef = useRef(null);
  const afterMasterActionRef = useRef(null);

  function isNeedMasterKey(item) {
    return Boolean(item.need_master_key || item.needMasterKey);
  }

  function mask(s) {
    if (!s) return "";
    return "•".repeat(String(s).length);
  }

  function flash(msg) {
    setStatus(msg);

    if (flashTimerRef.current) {
      clearTimeout(flashTimerRef.current);
    }

    flashTimerRef.current = setTimeout(() => {
      setStatus("");
    }, 2000);
  }

  async function copy(text) {
    try {
      await navigator.clipboard.writeText(text || "");
      flash("Скопировано в буфер обмена.");
    } catch {
      flash("Не удалось скопировать в буфер обмена.");
    }
  }

  function exportStub() {
    const text = items
      .map(
        (it, index) =>
          `#${index + 1}
Название: ${it.title || ""}
Логин: ${it.login || ""}
Пароль: ${it.password || ""}
Описание: ${it.notes || ""}
Мастер-код: ${isNeedMasterKey(it) ? "Нужен" : "Не нужен"}`
      )
      .join("\n------------------------------\n");

    const blob = new Blob([text], {
      type: "text/plain;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "secret_data.txt";
    link.click();

    URL.revokeObjectURL(url);
    flash("Экспорт выполнен.");
  }

  function editData(id, title, login, password, notes, needMasterKey) {
    setNewItem({
      id,
      title: title || "",
      login: login || "",
      password: password || "",
      notes: notes || "",
      needMasterKey: Boolean(needMasterKey),
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function loadRecords() {
    if (!user?.id) return;

    try {
      const res = await fetch(`/api/records/${user.id}`);

      if (!res.ok) {
        flash("Не удалось загрузить записи.");
        return;
      }

      const data = await res.json();

      console.log("records:", data);

      setItems(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      flash("Не удалось загрузить записи.");
    }
  }

  useEffect(() => {
    loadRecords();

    return () => {
      if (flashTimerRef.current) {
        clearTimeout(flashTimerRef.current);
      }
    };
  }, [user?.id]);

  useEffect(() => {
    const el = notesRef.current;

    if (!el) return;

    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  }, [newItem.notes]);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (!q) return items;

    return items.filter((it) => {
      return (
        (it.title || "").toLowerCase().includes(q) ||
        (it.login || "").toLowerCase().includes(q) ||
        (it.notes || "").toLowerCase().includes(q)
      );
    });
  }, [items, search]);

  async function updateItem(id) {
    const title = newItem.title.trim();
    const password = newItem.password.trim();

    if (!title || !password) return;

    try {
      const res = await fetch(`/api/editrecord/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          login: newItem.login.trim(),
          password,
          notes: newItem.notes,
          needMasterKey: newItem.needMasterKey,
        }),
      });

      if (!res.ok) {
        flash("Данные не удалось изменить.");
        return;
      }

      await loadRecords();

      setEditId(null);
      setNewItem(emptyItem);

      flash("Данные успешно изменились.");
    } catch (error) {
      console.error(error);
      flash("Данные не удалось изменить.");
    }
  }

  async function addItem() {
    const title = newItem.title.trim();
    const password = newItem.password.trim();

    if (!title || !password) return;

    if (!user?.id) {
      flash("Пользователь не найден.");
      return;
    }

    try {
      const res = await fetch("/api/addrecord", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          title,
          login: newItem.login.trim(),
          password,
          notes: newItem.notes,
          needMasterKey: newItem.needMasterKey,
        }),
      });

      if (!res.ok) {
        flash("Данные не удалось добавить.");
        return;
      }

      flash("Данные успешно добавлены.");
      setNewItem(emptyItem);

      await loadRecords();
    } catch (error) {
      console.error(error);
      flash("Данные не удалось добавить.");
    }
  }

  async function deleteItem(id) {
    try {
      const res = await fetch(`/api/record/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        flash("Данные не удалось удалить.");
        return;
      }

      setItems((prev) => prev.filter((x) => x.id !== id));
      setUnlockedIds((prev) => prev.filter((x) => x !== id));

      if (revealId === id) {
        setRevealId(null);
      }

      if (editId === id) {
        setEditId(null);
        setNewItem(emptyItem);
      }

      flash("Данные успешно удалены.");
    } catch (error) {
      console.error(error);
      flash("Данные не удалось удалить.");
    }
  }

  function onChange(e) {
    const { name, value } = e.target;

    setNewItem((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function openMasterModal(id, action) {
    setMasterModalId(id);
    setMasterKeyInput("");
    afterMasterActionRef.current = action;
  }

  function closeMasterModal() {
    setMasterModalId(null);
    setMasterKeyInput("");
    afterMasterActionRef.current = null;
  }

  async function checkMasterKey() {
    if (masterModalId === null || !masterKeyInput.trim()) {
      flash("Введите мастер-ключ.");
      return;
    }

    if (!user?.id) {
      flash("Пользователь не найден.");
      return;
    }

    try {
      const res = await fetch("/api/check-master-key", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          masterKey: masterKeyInput.trim(),
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        flash(data?.message || "Неверный мастер-ключ.");
        return;
      }

      const currentId = masterModalId;
      const action = afterMasterActionRef.current;

      setUnlockedIds((prev) =>
        prev.includes(currentId) ? prev : [...prev, currentId]
      );

      closeMasterModal();

      if (typeof action === "function") {
        action();
      } else {
        setRevealId(currentId);
      }

      flash("Мастер-ключ подтверждён.");
    } catch (error) {
      console.error(error);
      flash("Не удалось проверить мастер-ключ.");
    }
  }

  function canUseSecret(item, action) {
    const recordId = item.id;

    if (recordId === undefined || recordId === null) {
      flash("Ошибка: у записи нет id.");
      return;
    }

    if (!isNeedMasterKey(item)) {
      action();
      return;
    }

    if (unlockedIds.includes(recordId)) {
      action();
      return;
    }

    openMasterModal(recordId, action);
  }

  const canAdd = newItem.title.trim() && newItem.password.trim();

  return (
    <div className="vault">
      <div className="addMenu">
        <header className="vault__header">
          <div>
            <h1 className="vault__title">PasswordSuperSave (PSS)</h1>

            <div className="vault__subtitle">
              Ваши данные почти в безопасности.
            </div>

            {user ? (
              <div className="vault__subtitle">Пользователь: {user.name}</div>
            ) : null}
          </div>

          <div className="vault__actions">
            <button
              className="btn"
              style={{ width: "220px" }}
              onClick={exportStub}
            >
              Экспорт в .txt
            </button>
          </div>
        </header>

        {status ? <div className="notice">{status}</div> : null}

        <section className="panel">
          <div className="panel__row">
            <input
              style={{ height: "38px" }}
              name="title"
              className="input"
              placeholder="Название записи"
              value={newItem.title}
              onChange={onChange}
            />

            <input
              style={{ height: "38px" }}
              name="login"
              className="input"
              placeholder="Логин / Email"
              value={newItem.login}
              onChange={onChange}
            />

            <input
              style={{ height: "38px" }}
              name="password"
              className="input"
              placeholder="Пароль / Мастер код"
              value={newItem.password}
              onChange={onChange}
            />

            <textarea
              style={{ height: "38px" }}
              name="notes"
              ref={notesRef}
              className="textarea"
              placeholder="Описание / Дополнительные данные"
              value={newItem.notes}
              onChange={onChange}
              rows={1}
            />

            <label className="switchField">
              <span className="switchField__text">Использовать мастер-код</span>

              <input
                type="checkbox"
                checked={newItem.needMasterKey}
                onChange={(e) =>
                  setNewItem((prev) => ({
                    ...prev,
                    needMasterKey: e.target.checked,
                  }))
                }
              />

              <span className="switchField__slider"></span>
            </label>

            <button
              className="btn btn--primary"
              onClick={() => (editId ? updateItem(editId) : addItem())}
              disabled={!canAdd}
            >
              {editId ? "Изменить" : "Добавить"}
            </button>

            {editId && (
              <button
                className="btn btn--iconNoEdit"
                onClick={() => {
                  setEditId(null);
                  setNewItem(emptyItem);
                  flash("Вы отменили изменение.");
                }}
              >
                ✕
              </button>
            )}
          </div>
        </section>

        <div className="search">
          <input
            style={{ height: "38px" }}
            className="input search__input"
            placeholder="Поиск по названию / логину / заметкам"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <button
            className="btn btn--icon search__btn"
            onClick={() => setSearch("")}
            title="Очистить"
          >
            ✕
          </button>
        </div>
      </div>

      <section className="grid">
        {filteredItems.length === 0 ? (
          <div className="muted">Пока у вас нету записей.</div>
        ) : (
          filteredItems.map((it) => {
            const recordId = it.id;
            const revealed = revealId === recordId;
            const needMasterKey = isNeedMasterKey(it);

            return (
              <article key={recordId} className="card">
                <div className="card__top">
                  <div>
                    <div className="card__title" style={{ marginTop: 5 }}>
                      {it.title}
                    </div>

                    <div className="card__badge">
                      {needMasterKey ? "Мастер-код нужен" : "Без мастер-кода"}
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "row" }}>
                    <button
                      style={{ marginTop: "3px" }}
                      className="btn btn--iconEditBtn"
                      onClick={() => {
                        setEditId(recordId);

                        editData(
                          recordId,
                          it.title,
                          it.login,
                          it.password,
                          it.notes,
                          needMasterKey
                        );
                      }}
                    >
                      <img src={editIcon} alt="edit" />
                    </button>

                    <button
                      className="btn btn--icon"
                      onClick={() => setConfirmId(recordId)}
                    >
                      ✕
                    </button>
                  </div>
                </div>

                <div className="secret">
                  <div
                    className="secret__label"
                    style={{ marginBottom: "10px" }}
                  >
                    Данные
                  </div>

                  <div className="secret__row">
                    <div className="secret__fields">
                      <div className="secret__field">
                        <div className="secret__name">Логин</div>

                        <code className="secret__code">
                          {revealed ? it.login : mask(it.login)}
                        </code>
                      </div>

                      <div className="secret__field">
                        <div className="secret__name">Пароль</div>

                        <code className="secret__code">
                          {revealed ? it.password : mask(it.password)}
                        </code>
                      </div>

                      {it.notes ? (
                        <div className="secret__field">
                          <div className="secret__name">Описание</div>

                          <div className="secret__notes">
                            {revealed ? it.notes : mask(it.notes)}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="card__footer">
                  <div className="secret__left">
                    <div className="secret__name">Дата создания:</div>

                    <code className="secret__code">
                      {it.updated_at
                        ? new Date(it.updated_at).toLocaleString("ru-RU")
                        : "Нет даты"}
                    </code>
                  </div>

                  <div className="secret__actions">
                    <button
                      className="btn btn--iconOpenClosePas"
                      onClick={() => {
                        if (revealed) {
                          setRevealId(null);
                          return;
                        }

                        canUseSecret(it, () => setRevealId(recordId));
                      }}
                    >
                      {revealed ? (
                        <img src={openIcon} alt="open" />
                      ) : (
                        <img src={closeIcon} alt="close" />
                      )}
                    </button>

                    <button
                      className="btn"
                      onClick={() => canUseSecret(it, () => copy(it.login))}
                    >
                      Копировать логин
                    </button>

                    <button
                      className="btn"
                      onClick={() => canUseSecret(it, () => copy(it.password))}
                    >
                      Копировать пароль
                    </button>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </section>

      {confirmId !== null && (
        <div className="modal">
          <div className="modal__content">
            <p>Удалить запись?</p>

            <div className="modal__actions">
              <button
                className="btn btn--danger"
                style={{ width: 100 }}
                onClick={() => {
                  deleteItem(confirmId);
                  setConfirmId(null);
                }}
              >
                Да
              </button>

              <button
                className="btn"
                style={{ width: 100 }}
                onClick={() => setConfirmId(null)}
              >
                Нет
              </button>
            </div>
          </div>
        </div>
      )}

      {masterModalId !== null && (
        <MasterKeyModal
          value={masterKeyInput}
          onChange={setMasterKeyInput}
          onConfirm={checkMasterKey}
          onCancel={closeMasterModal}
          disabled={!masterKeyInput.trim()}
        />
      )}
    </div>
  );
}