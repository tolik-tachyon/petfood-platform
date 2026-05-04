import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  MdPets,
  MdAssignment,
  MdBarChart,
  MdPerson,
  MdSettings,
  MdNoteAlt,
  MdRestaurant,
  MdCategory,
  MdScience,
  MdLogout,
  MdInsights
} from 'react-icons/md';
import { useAuth } from '../../context/AuthContext';
import styles from '../styles/Sidebar.module.css';

export const Sidebar = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const role = user?.role;

  if (!user || role === 'ADMIN') {
    return <aside className={styles.sidebar} style={{ opacity: 0, pointerEvents: 'none' }} />;
  }

  const userMenuItems = [
    { icon: MdPets, label: 'Мои питомцы', path: '/dashboard' },
    { icon: MdAssignment, label: 'Заявки', path: '/requests' },
    { icon: MdInsights, label: 'Рекомендации', path: '/recommendations' },
    { icon: MdBarChart, label: 'Графики', path: '/analytics'},
    { icon: MdNoteAlt, label: 'Записи', path: '/records' },
  ];

  const vetMenuItems = [
    { icon: MdNoteAlt, label: 'Записи', path: '/vet/dashboard' },
    { icon: MdRestaurant, label: 'Ингредиенты', path: '/vet/ingredients' },
    { icon: MdCategory, label: 'Группы ингредиентов', path: '/vet/ingredient-groups' },
    { icon: MdScience, label: 'Нутриенты', path: '/vet/nutrients' },
  ];

  const bottomItems = [
    { icon: MdPerson, label: 'Профиль', path: '/profile' },
    { icon: MdSettings, label: 'Настройки', path: '/settings' },
  ];

  const menuItems = role === 'VET' ? vetMenuItems : userMenuItems;

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <aside
      className={`${styles.sidebar} ${isExpanded ? styles.expanded : ''}`}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      <nav className={styles.nav}>
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <button
              key={index}
              className={`${styles.navItem} ${isActive ? styles.active : ''}`}
              onClick={() => handleNavigation(item.path)}
              title={item.label}
            >
              <Icon className={styles.icon} />
              {isExpanded && <span className={styles.label}>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      <div className={styles.spacer}></div>

      <div className={styles.bottomNav}>
        {bottomItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <button
              key={index}
              className={`${styles.navItem} ${isActive ? styles.active : ''}`}
              onClick={() => handleNavigation(item.path)}
              title={item.label}
            >
              <Icon className={styles.icon} />
              {isExpanded && <span className={styles.label}>{item.label}</span>}
            </button>
          );
        })}

        <button
          className={`${styles.navItem} ${styles.logoutItem}`}
          onClick={handleLogout}
          title="Выйти"
        >
          <MdLogout className={styles.icon} />
          {isExpanded && <span className={styles.label}>Выйти</span>}
        </button>
      </div>
    </aside>
  );
};