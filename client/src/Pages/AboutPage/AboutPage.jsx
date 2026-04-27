import { useLocation, useNavigate } from "react-router-dom";
import "./AboutPage.scss";

export default function AboutPage() {
      const navigate = useNavigate();
  const location = useLocation();
  const user = location.state?.user;
  return (
    <main className="about">
      <section className="about__hero">
        <h1 className="about__title">PasswordSuperSave</h1>

        <p className="about__subtitle">
          PasswordSuperSave — это сайт для безопасного хранения данных от
          аккаунтов, паролей, логинов и другой важной информации.
        </p>
      </section>

      <section className="about__card">
        <h2>Для чего нужен сайт?</h2>

        <p>
          Этот сервис помогает хранить данные от ваших аккаунтов в одном месте.
          Вы можете добавлять записи с названием, логином, паролем и описанием,
          а затем быстро находить нужную информацию через поиск.
        </p>

        <p>
          Для дополнительной защиты отдельные записи можно закрывать
          мастер-ключом. Такие данные нельзя будет посмотреть или скопировать
          без подтверждения мастер-ключа.
        </p>
      </section>

      <section className="about__card">
        <h2>Безопасность</h2>

        <div className="about__security">
          <div className="about__securityItem">
            <span className="about__badge">SHA-256</span>
            <p>
              Для хеширования используется алгоритм SHA-256. Он применяется для
              преобразования важных данных в хеш.
            </p>
          </div>

          <div className="about__securityItem">
            <span className="about__badge">AES-256</span>
            <p>
              Для шифрования используется алгоритм AES-256. Он помогает
              защищать сохранённые данные от просмотра посторонними.
            </p>
          </div>
        </div>

        <p className="about__note">
          Важно: пароль и мастер-ключ не стоит передавать другим людям. Чем
          сложнее пароль, тем выше безопасность ваших данных.
        </p>
      </section>

      <section className="about__card">
        <h2>Как пользоваться сайтом?</h2>

        <ol className="about__steps">
          <li>
            <strong>Зарегистрируйтесь или войдите в аккаунт.</strong>
            <span>
              После входа вы попадёте на главную страницу с вашими записями.
            </span>
          </li>

          <li>
            <strong>Добавьте новую запись.</strong>
            <span>
              Укажите название, логин, пароль и, если нужно, дополнительное
              описание.
            </span>
          </li>

          <li>
            <strong>Включите мастер-ключ при необходимости.</strong>
            <span>
              Если запись содержит особенно важные данные, отметьте пункт
              “Использовать мастер-код”.
            </span>
          </li>

          <li>
            <strong>Просматривайте и копируйте данные.</strong>
            <span>
              Нажмите на кнопку показа пароля или используйте кнопки копирования
              логина и пароля.
            </span>
          </li>

          <li>
            <strong>Редактируйте или удаляйте записи.</strong>
            <span>
              При необходимости вы можете изменить сохранённые данные или
              удалить ненужную запись.
            </span>
          </li>

          <li>
            <strong>Экспортируйте данные.</strong>
            <span>
              При необходимости можно сохранить данные в текстовый файл через
              кнопку экспорта.
            </span>
          </li>
        </ol>
      </section>

      <section className="about__card about__card--warning">
        <h2>Рекомендации</h2>

        <ul className="about__list">
          <li>Используйте длинные и сложные пароли.</li>
          <li>Не используйте один и тот же пароль на разных сайтах.</li>
          <li>Не сообщайте мастер-ключ другим людям.</li>
          <li>Регулярно обновляйте важные пароли.</li>
          <li>Выходите из аккаунта, если используете чужой компьютер.</li>
        </ul>
      </section>
        <div className="about__back about__back--bottom">
        <button className="btn" style={{width: 400}} onClick={() => navigate("/secretroom",{state: {user}})}>
          На главную
        </button>
      </div>
    </main>
  );
}