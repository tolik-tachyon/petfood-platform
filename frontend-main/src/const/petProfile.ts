export const PET_PROFILE_TEXT = {
  PAGE_TITLE: 'Профиль питомца',
  BACK_BUTTON: 'Назад',
  DELETE_BUTTON: 'Удалить питомца',
  EXPORT_BUTTON: 'Скачать карточку',
  EDIT_BUTTON: 'Редактировать профиль',

  NOT_FOUND_TITLE: 'Питомец не найден',
  NOT_FOUND_BUTTON: 'Назад на главную',

  SECTION_BASIC_PARAMS: 'Основные параметры',
  SECTION_HISTORY: 'История веса и активности',
  SECTION_RECOMMENDATIONS: 'Рекомендации и расчеты',
  SECTION_CHANGE_LOGS: 'Логи изменений',

  LABEL_SPECIES: 'Вид животного',
  LABEL_BREED: 'Порода',
  LABEL_BIRTH_DATE: 'Дата рождения',
  LABEL_PASSPORT_ID: 'ID паспорта',
  LABEL_WEIGHT: 'Вес (кг)',
  LABEL_COLOR: 'Окрас',
  LABEL_NAME: 'Кличка',
  LABEL_GENDER: 'Пол',
  LABEL_REPRODUCTIVE_STATUS: 'Репродуктивный статус',
  LABEL_LACTATION_WEEK: 'Неделя лактации',
  LABEL_PUPPIES_COUNT: 'Количество щенков',

  GENDER_MALE: 'Самец',
  GENDER_FEMALE: 'Самка',
  PASSPORT_NOT_SPECIFIED: 'Не указан',
  NO_PHOTO: 'Нет фото',
  NO_DATA: 'Пока нет данных...',

  HISTORY_DATE: 'Дата',
  HISTORY_WEIGHT: 'Вес',
  HISTORY_ACTIVITY: 'Активность',

  MODAL_DELETE_TITLE: 'Удалить питомца?',
  MODAL_DELETE_MESSAGE: (petName: string) =>
    `Вы уверены, что хотите удалить профиль ${petName}? Это действие нельзя отменить.`,
  MODAL_DELETE_CONFIRM: 'Удалить',
  MODAL_DELETE_CANCEL: 'Отмена',
} as const;

export const REPRODUCTIVE_STATUS_LABELS = {
  PREGNANCY: 'Щенность',
  LACTATION: 'Период лактации',
} as const;

export const REPRODUCTIVE_STATUS_KEYWORDS = {
  PREGNANCY: ['pregnancy', 'щен'],
  LACTATION: ['lactation', 'лакта'],
} as const;