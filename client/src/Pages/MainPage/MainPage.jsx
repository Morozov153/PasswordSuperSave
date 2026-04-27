import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
//-----------------------------------------------------------Библиотеки реакта
import "./MainPage.scss";
//-----------------------------------------------------------Импорт стиля для страницы
import closeIcon from "../../image/closePassword.png";
import openIcon from "../../image/openPassword.png";
import editIcon from "../../image/editButton.png";
//-----------------------------------------------------------Импорт картинок
import MessageModal from "../Elements/MessageModal";
import MasterKeyModal from "../Elements/MasterKeyModal";
import QuestionModal from "../Elements/QuestionModal";
//-----------------------------------------------------------Импорт модальных окон

export default function MainPage({ setIsAuth }) 
{

  const navigate = useNavigate();
  const location = useLocation();
  const user = location.state?.user;
//-----------------------------------------------------------Переменные для взаимодействия между страницами
  const emptyItem = {
    title: "",
    login: "",
    password: "",
    notes: "",
    updated_at: "",
    needMasterKey: false};
//-----------------------------------------------------------Переменная для полей записи
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("");
  const [confirmId, setConfirmId] = useState(null);
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState("");
  const [revealId, setRevealId] = useState(null);
  const [newItem, setNewItem] = useState(emptyItem);

  const canAdd = newItem.title.trim() && newItem.password.trim();
//-----------------------------------------------------------Состояния для записей
  const [modal, setModal] = useState({ isOpen: false, title: "", message: ""});
  const [masterModalId, setMasterModalId] = useState(null);
  const [masterTitle, setMasterTitle] = useState("");
  const [masterKeyInput, setMasterKeyInput] = useState("");
  const [unlockedIds, setUnlockedIds] = useState([]);
  const [modalQuestion, setQuestionModal] = useState({ isOpen: false, title: "", question: ""});
//-----------------------------------------------------------Состояния для модальных окон
  const notesRef = useRef(null);
  const flashTimerRef = useRef(null);
  const afterMasterActionRef = useRef(null);
//-----------------------------------------------------------Ссылки для оптимазации
  useEffect(() => 
  {
    loadRecords()
    return () => {
      if (flashTimerRef.current) 
      {
        clearTimeout(flashTimerRef.current);
      }
    }
  }, [user?.id])

  useEffect(() => 
  {
    const el = notesRef.current

    if (!el) return

    el.style.height = "auto"
    el.style.height = el.scrollHeight + "px"
  }, [newItem.notes])

  const filteredItems = useMemo(() => 
  {
    const q = search.trim().toLowerCase();

    if (!q) return items;

    return items.filter((it) => 
    {
      return (
        (it.title || "").toLowerCase().includes(q) ||
        (it.login || "").toLowerCase().includes(q) ||
        (it.notes || "").toLowerCase().includes(q)
        );
    });
  }, [items, search]);

  function onChange(e) 
  {
    const { name, value } = e.target;
    setNewItem((prev) => ({...prev, [name]: value}));
  }
  //-----------------------------------------------------------Обновление страницы
  function showModal(title, message) 
  {
    setModal({ isOpen: true, title, message});
  }

  function closeModal() { 
    setModal({ isOpen: false, title: "", message: ""});
  }
//-----------------------------------------------------------Модальное окно - сообщение
  function showQuestionModal(title, question) 
  {
    setQuestionModal({ isOpen: true, title, question});
  }

  function closeQuestionModal() 
  {
    setQuestionModal({ isOpen: false, title: "", question: ""});
  }
//-----------------------------------------------------------Модальное окно - вопрос
  function openMasterModal(id, action,title) 
  {
    setMasterTitle(title)
    setMasterModalId(id);
    setMasterKeyInput("");
    afterMasterActionRef.current = action;
  }

  function closeMasterModal() 
  {
    setMasterModalId(null);
    setMasterKeyInput("");
    afterMasterActionRef.current = null;
  }
//-----------------------------------------------------------Модальное окно - мастер-ключ
  function mask(s) 
  {
    if (!s) return "";
    return "•".repeat(String(s).length);
  }
//-----------------------------------------------------------Функция маскировки пароля и логина
  function flash(msg) 
  {
    setStatus(msg);

    if (flashTimerRef.current) 
    {
      clearTimeout(flashTimerRef.current);
    }

    flashTimerRef.current = setTimeout(() => {setStatus("")}, 5000);
  }
//-----------------------------------------------------------Функция показа сообщения сверху 
  async function copy(text) 
  {
    try 
    {
      await navigator.clipboard.writeText(text || "");
      flash("Скопировано в буфер обмена.");
    } 
    catch 
    {
      flash("Не удалось скопировать в буфер обмена.");
    }
  }
//-----------------------------------------------------------Функция копирования логина и пароля
  function exitOnAuth() 
  {
    showQuestionModal("Подтверждение","Вы уверены, что хотите выйти из аккаунта?")
  }

  function confirmExitOnAuth() 
  {
    closeQuestionModal();
    setIsAuth(false);
    navigate("/authorization", { replace: true })
  }
//-----------------------------------------------------------Функция выхода из аккаунта
  function exportStub() 
  {
    const text = items.map((it, index) =>
`#${index + 1}
Название: ${it.title || ""}
Логин: ${it.login || ""}
Пароль: ${it.password || ""}
Описание: ${it.notes || ""}`).join("\n------------------------------\n")
    const blob = new Blob([text], {type: "text/plain;charset=utf-8;"});
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "secret_data.txt";
    link.click();

    URL.revokeObjectURL(url);
    flash("Экспорт данных выполнен в файл secret_data.txt");
  }
//-----------------------------------------------------------Функция экспорта данных
  function editData(id, title, login, password, notes, needMasterKey) 
  {
    setNewItem({
      id,
      title: title || "",
      login: login || "",
      password: password || "",
      notes: notes || "",
      needMasterKey: Boolean(needMasterKey),
    });

    window.scrollTo({top: 0,behavior: "smooth"});
  }
//-----------------------------------------------------------Функция редактирования записей
  async function loadRecords() 
  {
    if (!user?.id) return;

    try 
    {
      const res = await fetch(`/api/records/${user.id}`)

      if (!res.ok) 
      {
        flash("Не удалось загрузить записи.")
        return;
      }

      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } 
    catch (error) 
    {
      console.error(error)
    }
  }
//-----------------------------------------------------------Функция загрузки записей (API)
  async function updateItem(id) 
  {
    const title = newItem.title.trim();
    const password = newItem.password.trim();

    if (!title || !password) return;

    try 
    {
      const res = await fetch(`/api/editrecord/${id}`, 
      {
        method: "PUT",
        headers: 
        {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
            title,
            login: newItem.login.trim(),
            password,
            notes: newItem.notes,
            needMasterKey: newItem.needMasterKey,
        }),
      })

      if (!res.ok) 
      {
        flash("Данные не удалось изменить.")
        return;
      }

      await loadRecords()

      setEditId(null)
      setNewItem(emptyItem)

      flash("Данные успешно изменились.")
    } 
    catch (error) 
    {
      console.error(error)
    }
  }
//-----------------------------------------------------------Функция изменения записей (API)
  async function addItem() 
  {
    const title = newItem.title.trim();
    const password = newItem.password.trim();

    if (!title || !password) return;

    if (!user?.id) 
    {
      flash("Пользователь не найден.");
      return;
    }

    try 
    {
      const res = await fetch("/api/addrecord", 
      {
        method: "POST",
        headers: 
        {
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

      if (!res.ok) 
      {
        flash("Данные не удалось добавить.");
        return;
      }
      
      await loadRecords();
      flash("Данные успешно добавлены.");
      setNewItem(emptyItem);
    } 
    catch (error) 
    {
      console.error(error);
    }
  }
//-----------------------------------------------------------Функция добавления записей (API)
  async function deleteItem(id) 
  {
    try 
    {
      const res = await fetch(`/api/record/${id}`, 
      {
        method: "DELETE",
      });

      if (!res.ok) 
      {
        flash("Данные не удалось удалить.");
        return;
      }

      setItems((prev) => prev.filter((x) => x.id !== id));
      setUnlockedIds((prev) => prev.filter((x) => x !== id));

      if (revealId === id) 
        {
        setRevealId(null);
      }

      if (editId === id) 
      {
        setEditId(null);
        setNewItem(emptyItem);
      }

      flash("Данные успешно удалены.");
    } 
    catch (error) 
    {
      console.error(error);
    }
  }
//-----------------------------------------------------------Функция удаления записей (API)

  async function checkMasterKey() 
  {
    if (masterModalId === null || !masterKeyInput.trim()) 
    {
      flash("Введите мастер-ключ.");
      return;
    }

    if (!user?.id) 
    {
      flash("Пользователь не найден.");
      return;
    }

    try 
    {
      const res = await fetch("/api/check-master-key", 
      {
        method: "POST",
        headers: 
        {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          masterKey: masterKeyInput.trim(),
        }),
      });

      await res.json().catch(() => null);

      if (!res.ok) 
      {
        showModal("Неверный мастер-ключ","Попробуйте ввести мастер-ключ еще раз.")
        setMasterKeyInput("")
        return;
      }

      const currentId = masterModalId;
      const action = afterMasterActionRef.current;

      if (currentId !== "export") 
      {
        setUnlockedIds((prev) => prev.includes(currentId) ? prev : [...prev, currentId])
      }

      closeMasterModal();

      if (typeof action === "function") 
      {
        action();
      } 
      else if (currentId !== "export") 
      {
        setRevealId(currentId);
      }

      showModal("Успешно", "Мастер-ключ подтверждён.");
    } 
    catch (error) 
    {
      console.error(error)
    }
  }
//-----------------------------------------------------------Функция проверки мастер-ключа (API)
  function isNeedMasterKey(item) 
  {
    return Boolean(item.need_master_key || item.needMasterKey);
  }
//-----------------------------------------------------------Функция проверки надобности мастер-ключа
  function canUseSecret(item, action) 
  {
    const recordId = item.id;

    if (recordId === undefined || recordId === null) 
    {
      flash("Ошибка: у записи нет id.");
      return;
    }

    if (!isNeedMasterKey(item)) 
    {
      action();
      return;
    }

    if (unlockedIds.includes(recordId)) 
    {
      action();
      return;
    }

    openMasterModal(recordId, action,"Для просмотра данных нужно ввести мастер-ключ.");
  }
  //-----------------------------------------------------------Функции проверки вводился ли мастер-ключ ранее













  return (
    <div className="vault">
      <div className="addMenu">
        <header className="vault__header">
          <div>
            <h1 className="vault__title">PasswordSuperSave (PSS)</h1>
            <div className="vault__subtitle">Ваши данные почти в безопасности.</div>
          </div>
          <div className="parent">
            <div className="vault__actions">
              <button className="btn" style={{ width: "100px" }} onClick={() => navigate("/about", {state: {user}})}>
                О сайте
              </button>
            </div>

            <div className="vault__actions">
              <button  className="btn" style={{ width: "200px" }} onClick={() => openMasterModal("export", exportStub,"Для экспорта данных нужно ввести мастер-ключ.")}>
                Экспорт в .txt
              </button>
            </div>

            <div className="vault__actions">
              <button className="btn" style={{ width: "200px" }} onClick={exitOnAuth}>
                Выйти из аккаунта
              </button>
            </div>
          </div>
        </header>

        {status ? <div className="notice">{status}</div> : null}

        <section className="panel">
          <div className="panel__row">
            <input style={{ height: "38px" }} name="title" className="input" placeholder="Название записи" value={newItem.title} onChange={onChange}/>
            <input style={{ height: "38px" }} name="login" className="input" placeholder="Логин / Email" value={newItem.login} onChange={onChange}/>
            <input style={{ height: "38px" }} name="password" className="input" placeholder="Пароль / Мастер код" value={newItem.password} 
            onChange={onChange}/>
            <textarea style={{ height: "38px" }} name="notes" ref={notesRef} className="textarea" placeholder="Описание / Дополнительные данные" value={newItem.notes} onChange={onChange} rows={1}/>

            <label className="switchField">
              <span className="switchField__text">Использовать мастер-код</span>
              <input type="checkbox" checked={newItem.needMasterKey} onChange={(e) => setNewItem((prev) => ({ ...prev, needMasterKey: e.target.checked}))}/>
              <span className="switchField__slider"></span>
            </label>

            <button className="btn btn--primary" onClick={() => (editId ? updateItem(editId) : addItem())} disabled={!canAdd}>
              {editId ? "Изменить" : "Добавить"}
            </button>

            {editId && 
            (
              <button className="btn btn--iconNoEdit" onClick={() => {setEditId(null); setNewItem(emptyItem); flash("Вы отменили изменение.")}}>
                ✕
              </button>
            )}
          </div>
        </section>

        <div className="search">
          <input style={{ height: "38px" }} className="input search__input" placeholder="Поиск по названию / логину / описанию" value={search}
            onChange={(e) => setSearch(e.target.value)}/>

          <button className="btn btn--icon search__btn" onClick={() => setSearch("")} title="Очистить">
            ✕
          </button>
        </div>
      </div>

      <section className="grid">
        {filteredItems.length === 0 ? 
        (
          <div className="muted">Пока у вас нет записей.</div>
        ) : 
        (
          filteredItems.map((it) => 
          {
            const recordId = it.id;
            const revealed = revealId === recordId;
            const needMasterKey = isNeedMasterKey(it)
            return (
              <article key={recordId} className="card">
                <div className="card__top">
                  <div style={{display: "flex",flexDirection: "row",alignItems: "center",}}>
                    <div className="card__title" style={{ marginTop: 5 }}>
                      {it.title}
                    </div>
                    {needMasterKey && (<div title="Для просмотра данной записи нужен мастер-ключ" style={{marginTop: "6.2px",marginLeft: "4px",fontSize: "12px",fontWeight: "900",color: "#2563eb",lineHeight: 1}}>★</div>)}
                  </div>

                  <div style={{ display: "flex", flexDirection: "row" }}>
                    <button style={{ marginTop: "3px" }} className="btn btn--iconEditBtn" 
                      onClick={() => 
                      {
                        setEditId(recordId);
                        editData(recordId,it.title,it.login,it.password,it.notes,needMasterKey);
                      }}>

                      <img src={editIcon} alt="edit" />
                    </button>

                    <button className="btn btn--icon" onClick={() => setConfirmId(recordId)}>
                      ✕
                    </button>
                  </div>
                </div>

                <div className="secret">
                  <div className="secret__label" style={{ marginBottom: "10px" }}>
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

                      {it.notes ? 
                      (
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
                      {it.updated_at ? new Date(it.updated_at).toLocaleString("ru-RU") : "Нет даты"}
                    </code>
                  </div>

                  <div className="secret__actions">
                    <button className="btn btn--iconOpenClosePas" onClick={() => 
                    {
                      if (revealed) 
                      {
                        setRevealId(null);
                        return;
                      }

                      canUseSecret(it, () => setRevealId(recordId));
                    }}>
                    {revealed ? 
                    (
                      <img src={openIcon} alt="open"/>
                    ) 
                    :(
                        <img src={closeIcon} alt="close"/>
                    )}
                    </button>

                    <button className="btn" onClick={() => canUseSecret(it, () => copy(it.login))}>
                      Копировать логин
                    </button>

                    <button className="btn" onClick={() => canUseSecret(it, () => copy(it.password))}>
                      Копировать пароль
                    </button>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </section>

      {confirmId !== null && 
      (
        <div className="modal">
          <div className="modal__content">
            <p>Удалить запись?</p>

            <div className="modal__actions">
              <button className="btn btn--danger" style={{ width: 100 }}
                onClick={() => 
                {
                  deleteItem(confirmId);
                  setConfirmId(null);
                }}>
                Да
              </button>

              <button className="btn" style={{ width: 100 }} onClick={() => setConfirmId(null)}>
                Нет
              </button>
            </div>
          </div>
        </div>
      )}

      {masterModalId !== null && 
      (
        <MasterKeyModal
          title={masterTitle}
          value={masterKeyInput}
          onChange={setMasterKeyInput}
          onConfirm={checkMasterKey}
          onCancel={closeMasterModal}
          disabled={!masterKeyInput.trim()}/>
      )}

      <MessageModal isOpen={modal.isOpen} title={modal.title} message={modal.message} onClose={closeModal}/>

      <QuestionModal isOpen={modalQuestion.isOpen} title={modalQuestion.title} question={modalQuestion.question} 
      onYes={confirmExitOnAuth}
      onNo={closeQuestionModal}/>
    </div>
  );
}