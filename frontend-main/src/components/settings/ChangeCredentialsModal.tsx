import { MdChevronRight } from 'react-icons/md';
import styles from '../../styles/SettingsModals.module.css';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onChangeLogin: () => void;
  onChangePassword: () => void;
};

const ChangeCredentialsModal = ({ isOpen, onClose, onChangeLogin, onChangePassword }: Props) => {
  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 className={styles.title}>Изменить логин и/или пароль</h2>

        <div
          className={styles.menuItem}
          onClick={() => {
            onClose();
            onChangeLogin();
          }}
        >
          <div className={styles.menuItemText}>
            <span className={styles.menuItemTitle}>Изменить логин</span>
            <span className={styles.menuItemDesc}>
              Изменить электронную почту, используемую для входа в аккаунт
            </span>
          </div>
          <MdChevronRight className={styles.menuChevron} />
        </div>

        <div
          className={styles.menuItem}
          onClick={() => {
            onClose();
            onChangePassword();
          }}
        >
          <div className={styles.menuItemText}>
            <span className={styles.menuItemTitle}>Изменить пароль</span>
            <span className={styles.menuItemDesc}>
              Установить новый пароль для входа в аккаунт
            </span>
          </div>
          <MdChevronRight className={styles.menuChevron} />
        </div>
      </div>
    </div>
  );
};

export default ChangeCredentialsModal;
