import { useState, useMemo } from 'react';
import { MdSearch } from 'react-icons/md';
import styles from '../../styles/SettingsModals.module.css';

type Language = {
  code: string;
  label: string;
  sublabel: string;
};

const LANGUAGES: Language[] = [
  { code: 'ru', label: 'Русский', sublabel: 'Russian' },
  { code: 'en', label: 'English', sublabel: 'English' },
  { code: 'kz', label: 'Қазақ', sublabel: 'Kazakh' },
];

type Props = {
  isOpen: boolean;
  currentLanguage: string;
  onClose: () => void;
  onSave: (langCode: string, langLabel: string) => void;
};

const LanguageModal = ({ isOpen, currentLanguage, onClose, onSave }: Props) => {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(currentLanguage);

  const filtered = useMemo(
    () =>
      LANGUAGES.filter(
        (l) =>
          l.label.toLowerCase().includes(search.toLowerCase()) ||
          l.sublabel.toLowerCase().includes(search.toLowerCase()),
      ),
    [search],
  );

  const handleOk = () => {
    const lang = LANGUAGES.find((l) => l.code === selected);
    if (lang) onSave(lang.code, lang.label);
    onClose();
  };

  const handleClose = () => {
    setSearch('');
    setSelected(currentLanguage);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={handleClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.title}>Язык</h2>

        <div className={styles.searchRow}>
          <MdSearch className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            placeholder="Поиск"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className={styles.langList}>
          {filtered.map((lang) => (
            <div
              key={lang.code}
              className={styles.langItem}
              onClick={() => setSelected(lang.code)}
            >
              <div
                className={`${styles.langRadio} ${selected === lang.code ? styles.langRadioSelected : ''}`}
              >
                {selected === lang.code && <div className={styles.langRadioDot} />}
              </div>
              <div className={styles.langNames}>
                <span className={styles.langNamePrimary}>{lang.label}</span>
                <span className={styles.langNameSecondary}>{lang.sublabel}</span>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.btnRow}>
          <button className={styles.btnPrimary} onClick={handleOk}>
            Ok
          </button>
          <button className={styles.btnSecondary} onClick={handleClose}>
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
};

export default LanguageModal;
