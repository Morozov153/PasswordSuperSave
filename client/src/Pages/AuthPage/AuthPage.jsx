import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AuthPage.scss";
import MessageModal from "../Elements/MessageModal";

export default function AuthPage({ setIsAuth }) {
  const navigate = useNavigate();

  const [mode, setMode] = useState("login");
  const isRegister = mode === "register";

  const [auth, setAuth] = useState({email: "", password: "",});

  const [reg, setReg] = useState({name: "",login: "",password: "",confirm: "",masterKey: "",});

  const [modal, setModal] = useState({ isOpen: false, title: "", message: ""});

  function showModal(title, message) {setModal({ isOpen: true, title, message, })}
  function closeModal() {setModal({isOpen: false,title: "",message: "",})}

  async function handleAuth()
  {
    const userLogin = auth.email.trim();
    const userPassword = auth.password.trim();
    if (!userLogin || !userPassword) 
    {
      showModal("Внимание", "Введите вашу электронную почту и пароль.");
      return
    }
    if (!userLogin.includes("@") || !userLogin.includes(".")) 
    {
      showModal("Внимание", "Введите корректный email.");
      return
    }
    try 
    {
      const request = await fetch(`/api/authuser`, 
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          {
            email: userLogin, 
            password: userPassword,
          })
      });
      if (request.status === 404) 
      {
        showModal("Неверные данные", "Попробуйте ввести другие данные для авторизации.");
        return;
      }
      if (request.ok) 
      {
        const data = await request.json();
        setIsAuth(true);
        navigate("/secretroom",{state: {user: data.user}});
      }
    } 
    catch (err) 
    {
      console.error("Ошибка авторизации:", err);
    }
  }

  async function handleRegistr() 
  {
    const name = reg.name.trim();
    const userLogin = reg.login.trim();
    const password = reg.password.trim();
    const masterKey = reg.masterKey.trim();

    if (!name || !userLogin || !password || !masterKey) {
      showModal("Внимание", "Заполните все поля.");
      return
    }
    if(name.length < 2)
    {
      showModal("Внимание", "Имя пользователя должно состоять из более 2-х символов.");
      return
    }
    if (!userLogin.includes("@") || !userLogin.includes(".")) 
    {
      showModal("Внимание", "Введите корректный email.");
      return;
    }
    if(password.length < 8)
    {
      showModal("Внимание", "Пароль должен состоять из 8 и более символов.");
      return
    }
    if (password !== reg.confirm) 
    {
      showModal("Внимание", "Пароли не совпадают.");
      return
    }
    try {
        const request = await fetch(`/api/isthereuser/${encodeURIComponent(userLogin)}`);
        if (request.status === 404) 
          {
          const res = await fetch("/api/adduser", {
            method: "POST",
            headers: 
            {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              name,
              login: userLogin,
              password,
              masterKey,
            }),
          });

          if (!res.ok) 
          {
            showModal("Ошибка регистрации", "Не удалось создать аккаунт.");
            return;
          }

          showModal("Регистрация успешна","Аккаунт успешно создан.");

          setReg({ name: "", login: "", password: "", confirm: "", masterKey: "", });
          setMode("login")
          return;
        }

        if (request.ok) 
        {
          showModal("Ошибка", "Пользователь с такой почтой уже существует.");
          return;
        }
        showModal("Ошибка", "Не удалось проверить пользователя.");
      } 
      catch (err) 
      {
        console.error("Ошибка запроса:", err);
      }
  }

  return (
    <div className="authCenter">
      <div className="authCenter__card">
        <div className="authCenter__head">
          <h1 className="authCenter__title">
            {isRegister ? "Регистрация" : "Вход"}
          </h1>

          <p className="authCenter__subtitle">
            {isRegister ? "Создай аккаунт и храни свои данные почти в безопасности." : "Введите свой email и пароль, чтобы войти."}
          </p>
        </div>

        <div className={`authCenter__forms ${isRegister ? "is-register" : "is-login"}`}>

          <form className="authCenter__form authCenter__form--login">
            <div className="authCenter__field">
              <input className="authCenter__input" type="email" value={auth.email} onChange={(e) =>
                  setAuth((p) => ({  ...p, email: e.target.value, }))} placeholder="Email" autoComplete="email" />
            </div>

            <div className="authCenter__field">
              <input className="authCenter__input" type="password" value={auth.password} placeholder="Password" onChange={(e) =>
                  setAuth((p) => ({ ...p, password: e.target.value, }))} autoComplete="current-password" />
            </div>

            <button type="button" className="authCenter__btn" onClick={handleAuth} >
              Войти
            </button>

            <div className="authCenter__row">
              <button className="authCenter__link" type="button" onClick={() => alert("Forgot?")}>
                Забыли пароль?
              </button>

              <button className="authCenter__link" type="button" onClick={() => setMode("register")}>
                <b>Регистрация</b>
              </button>
            </div>
          </form>

          <form className="authCenter__form authCenter__form--register">
            <div className="authCenter__field">
              <input className="authCenter__input" value={reg.name} onChange={(e) =>
                  setReg((p) => ({ ...p, name: e.target.value, }))} placeholder="Ваше имя" autoComplete="name"/>
            </div>

            <div className="authCenter__field">
              <input className="authCenter__input" type="email" value={reg.login} onChange={(e) =>
                  setReg((p) => ({ ...p, login: e.target.value, }))} placeholder="Email" autoComplete="email"/>
            </div>

            <div className="authCenter__field">
              <input className="authCenter__input" type="password" value={reg.password} onChange={(e) =>
                  setReg((p) => ({ ...p, password: e.target.value, }))} placeholder="Пароль" autoComplete="new-password"/>
            </div>

            <div className="authCenter__field">
              <input className="authCenter__input" type="password" value={reg.confirm} onChange={(e) =>
                  setReg((p) => ({ ...p, confirm: e.target.value,}))} placeholder="Подтверждение пароля" autoComplete="new-password"/>
            </div>

            <div className="authCenter__field">
              <input className="authCenter__input" value={reg.masterKey} onChange={(e) =>
                  setReg((p) => ({ ...p, masterKey: e.target.value, }))} placeholder="Мастер ключ"/>
            </div>

            <button type="button" className="authCenter__btn" onClick={handleRegistr}>
              Создать аккаунт
            </button>

            <button className="authCenter__btn authCenter__btn--secondary" type="button" onClick={() => setMode("login")}>
              Уже есть аккаунт? Войти
            </button>
          </form>
        </div>
      </div>
      <MessageModal  isOpen={modal.isOpen} title={modal.title} message={modal.message} onClose={closeModal}/>
    </div>
  );
}