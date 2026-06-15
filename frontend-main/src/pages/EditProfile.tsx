import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdChevronLeft, MdEdit, MdDeleteOutline, MdPerson, MdCalendarToday } from 'react-icons/md';
import { Layout } from '../../layout/Layout';
import { useAuth } from '../../context/AuthContext';
import styles from '../styles/EditProfile.module.css';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

const COUNTRIES = ['Казахстан', 'Россия', 'Узбекистан', 'Кыргызстан', 'Беларусь'];

export const EditProfile = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [birthDate, setBirthDate] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/api/v1/account/profile/me`, {
          method: 'GET',
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Не удалось загрузить данные профиля');
        }

        const data = await response.json();

        setFirstName(data.firstName ?? '');
        setLastName(data.lastName ?? '');
        setPhone(data.phone ?? '');
        setBirthDate(data.birthDate ?? '');
        setCountry(data.country ?? '');
        setCity(data.city ?? '');
      } catch (err: any) {
        setFetchError(err.message || 'Произошла ошибка при загрузке профиля');
      } finally {
        setInitialLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleAvatarPick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setAvatarUrl(url);
  };

  const handleAvatarDelete = () => {
    setAvatarUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (!firstName.trim()) next.firstName = 'Введите имя';
    if (!lastName.trim()) next.lastName = 'Введите фамилию';
    if (!birthDate.trim()) next.birthDate = 'Укажите дату рождения';
    if (!city.trim()) next.city = 'Введите город';

    const phoneRegex = /^\+?[0-9\s-]{7,20}$/;
    if (!phone.trim()) {
      next.phone = 'Введите номер телефона';
    } else if (!phoneRegex.test(phone)) {
      next.phone = 'Неверный формат номера';
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setLoading(true);
    setFetchError('');

    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/account`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName,
          phone,
          birthDate,
          country,
          city,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || 'Не удалось сохранить профиль');
      }

      navigate('/settings');
    } catch (err: any) {
      setFetchError(err.message || 'Произошла ошибка при сохранении');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/settings');
  };

  return (
    <Layout showSidebar={true}>
      <div className={styles.page}>
        <header className={styles.header}>
          <button className={styles.backBtn} onClick={handleCancel}>
            <MdChevronLeft size={16} />
            Назад
          </button>
          <h1 className={styles.headerTitle}>Редактирование профиля</h1>
        </header>

        {initialLoading && <p style={{ color: '#888', fontSize: 13, margin: '0 0 12px' }}>Загрузка...</p>}
        {fetchError && <p className={styles.errorText}>{fetchError}</p>}

        <div className={styles.card}>
          <div className={styles.avatarBlock}>
            <div className={styles.avatarFrame}>
              {avatarUrl ? (
                <img src={avatarUrl} alt="Аватар" className={styles.avatarPhoto} />
              ) : (
                <MdPerson size={96} className={styles.avatarIcon} />
              )}
            </div>
            <div className={styles.avatarActions}>
              <button
                type="button"
                className={styles.avatarActionBtn}
                onClick={handleAvatarPick}
                title="Изменить фото"
              >
                <MdEdit size={20} />
              </button>
              <button
                type="button"
                className={`${styles.avatarActionBtn} danger`}
                onClick={handleAvatarDelete}
                title="Удалить фото"
              >
                <MdDeleteOutline size={20} />
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className={styles.hiddenInput}
              onChange={handleAvatarChange}
            />
          </div>

          <div className={styles.form}>
            <div>
              <p className={styles.fieldLabel}>Имя</p>
              <input
                className={`${styles.inputField} ${errors.firstName ? styles.inputError : ''}`}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
              {errors.firstName && <p className={styles.errorText}>{errors.firstName}</p>}
            </div>

            <div>
              <p className={styles.fieldLabel}>Фамилия</p>
              <input
                className={`${styles.inputField} ${errors.lastName ? styles.inputError : ''}`}
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
              {errors.lastName && <p className={styles.errorText}>{errors.lastName}</p>}
            </div>

            <div>
              <p className={styles.fieldLabel}>Дата рождения</p>
              <div className={styles.dateInputWrapper}>
                <input
                  type="date"
                  className={`${styles.inputField} ${errors.birthDate ? styles.inputError : ''}`}
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                />
                <MdCalendarToday size={18} className={styles.dateIcon} />
              </div>
              {errors.birthDate && <p className={styles.errorText}>{errors.birthDate}</p>}
            </div>

            <div>
              <p className={styles.fieldLabel}>Страна</p>
              <select
                className={styles.selectField}
                value={country}
                onChange={(e) => setCountry(e.target.value)}
              >
                <option value="">Не указано</option>
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <p className={styles.fieldLabel}>Город</p>
              <input
                className={`${styles.inputField} ${errors.city ? styles.inputError : ''}`}
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
              {errors.city && <p className={styles.errorText}>{errors.city}</p>}
            </div>

            <div>
              <p className={styles.fieldLabel}>Телефон</p>
              <input
                className={`${styles.inputField} ${errors.phone ? styles.inputError : ''}`}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+7 777 77 7777"
              />
              {errors.phone && <p className={styles.errorText}>{errors.phone}</p>}
            </div>
          </div>
        </div>

        <div className={styles.footer}>
          <button className={styles.saveBtn} onClick={handleSave} disabled={loading}>
            {loading ? 'Сохранение...' : 'Сохранить'}
          </button>
          <button className={styles.cancelBtn} onClick={handleCancel}>
            Отмена
          </button>
        </div>
      </div>
    </Layout>
  );
};
