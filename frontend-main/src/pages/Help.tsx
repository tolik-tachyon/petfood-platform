import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdChevronLeft } from 'react-icons/md';
import { Layout } from '../../layout/Layout';
import styles from '../styles/Help.module.css';

export const Help = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [titleError, setTitleError] = useState('');
  const [descError, setDescError] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    let valid = true;

    if (!title.trim()) {
      setTitleError('Введите название проблемы');
      valid = false;
    } else {
      setTitleError('');
    }

    if (!description.trim()) {
      setDescError('Опишите вашу проблему');
      valid = false;
    } else {
      setDescError('');
    }

    if (!valid) return;

    setLoading(true);
    // Имитируем отправку (backend endpoint пока не реализован)
    await new Promise((res) => setTimeout(res, 800));
    setLoading(false);
    setSubmitted(true);
  };

  const handleAnother = () => {
    setTitle('');
    setDescription('');
    setTitleError('');
    setDescError('');
    setSubmitted(false);
  };

  return (
    <Layout showSidebar={true}>
      <div className={styles.page}>
        <header className={styles.header}>
          <button className={styles.backBtn} onClick={() => navigate('/settings')}>
            <MdChevronLeft size={16} />
            Назад
          </button>
          <h1 className={styles.headerTitle}>Помощь</h1>
        </header>

        <div className={styles.card}>
          {submitted ? (
            <>
              <p className={styles.successTitle}>Запрос отправлен</p>
              <p className={styles.successSubtitle}>
                Постараемся рассмотреть ваш запрос в ближайшее время. Приносим
                извинения за неудобства
              </p>
              <button className={styles.submitBtn} onClick={handleAnother}>
                Отправить ещё один запрос
              </button>
            </>
          ) : (
            <>
              <p className={styles.formTitle}>Опишите вашу проблему в запросе</p>
              <p className={styles.formSubtitle}>
                Мы свяжемся с вами по электронной почте после рассмотрения.
              </p>

              <input
                className={`${styles.inputField} ${titleError ? styles.inputError : ''}`}
                placeholder="Название проблемы"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setTitleError('');
                }}
              />
              {titleError && <p className={styles.errorText}>{titleError}</p>}

              <textarea
                className={`${styles.textarea} ${descError ? styles.inputError : ''}`}
                placeholder="Опишите вашу проблему"
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  setDescError('');
                }}
              />
              {descError && <p className={styles.errorText}>{descError}</p>}

              <button className={styles.submitBtn} onClick={handleSubmit} disabled={loading}>
                {loading ? 'Отправка...' : 'Отправить'}
              </button>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};