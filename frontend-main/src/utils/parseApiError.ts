type ValidationIssue = {
  msg?: string;
  loc?: unknown[];
};

const formatValidationIssue = (issue: ValidationIssue): string => {
  const location = Array.isArray(issue.loc)
    ? issue.loc.filter((part) => part !== 'body').join(' → ')
    : '';
  const message = issue.msg || 'Некорректные данные';

  if (location.includes('target_kcal')) {
    return 'Не указана целевая калорийность. Введите значение в поле ккал и нажмите «Пересчитать».';
  }

  return location ? `${location}: ${message}` : message;
};

const RECIPE_COMPOSITION_ERROR =
  'Could not find valid recipe composition';

export const humanizeRecommenderError = (message: string): string => {
  const trimmed = message.trim();
  if (!trimmed) return message;

  const quotedIngredient = trimmed.match(/^[''](.+?)['']$/);
  if (quotedIngredient) {
    return `Ингредиент «${quotedIngredient[1]}» отсутствует в базе питательных данных. Уберите его из списка или замените на другой.`;
  }

  if (trimmed === RECIPE_COMPOSITION_ERROR) {
    return 'Не удалось подобрать состав с текущими ингредиентами и ограничениями. Расширьте диапазоны нутриентов или измените набор ингредиентов.';
  }

  if (/target_kcal/i.test(trimmed) && /Field required|обязательн/i.test(trimmed)) {
    return 'Не указана целевая калорийность. Введите значение в поле ккал и нажмите «Пересчитать».';
  }

  const missingIngredientsMatch = trimmed.match(
    /Для этих ингредиентов нет данных о составе:\s*(.+)/i
  );
  if (missingIngredientsMatch) {
    return trimmed;
  }

  return trimmed;
};

export const parseApiErrorBody = (body: unknown): string | null => {
  if (!body) return null;

  if (typeof body === 'string') {
    const trimmed = body.trim();
    return trimmed || null;
  }

  if (typeof body !== 'object') return null;

  const record = body as Record<string, unknown>;

  if (typeof record.detail === 'string') {
    return humanizeRecommenderError(record.detail);
  }

  if (Array.isArray(record.detail)) {
    const messages = record.detail
      .map((item) => {
        if (typeof item === 'string') return item;
        if (item && typeof item === 'object') return formatValidationIssue(item as ValidationIssue);
        return null;
      })
      .filter(Boolean);

    return messages.length > 0
      ? messages.map((item) => humanizeRecommenderError(String(item))).join('\n')
      : null;
  }

  if (typeof record.message === 'string') {
    if (record.message.includes('SID cookie is required')) {
      return 'Сессия истекла. Войдите в аккаунт снова.';
    }
    return record.message;
  }
  if (typeof record.error === 'string') return record.error;

  return null;
};

export const parseApiErrorText = (text: string): string | null => {
  const trimmed = text.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      return parseApiErrorBody(JSON.parse(trimmed));
    } catch {
      return trimmed;
    }
  }

  return trimmed;
};

export const toUserErrorMessage = (error: unknown, fallback: string): string => {
  if (!(error instanceof Error)) return fallback;

  const message = error.message.trim();
  if (!message) return fallback;

  if (message.includes('Запрос превысил время ожидания')) {
    return 'Сервер долго обрабатывает запрос. Если идёт расчёт рецепта — дождитесь его завершения и повторите. Иначе попробуйте ещё раз через несколько секунд.';
  }

  const apiPrefix = message.match(/^API Error:\s*\d+\s*-\s*(.*)$/s);
  if (apiPrefix) {
    const parsed = parseApiErrorText(apiPrefix[1]);
    if (parsed) return parsed;
  }

  const jsonMatch = message.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    const parsed = parseApiErrorText(jsonMatch[0]);
    if (parsed) return parsed;
  }

  if (
    message.startsWith('Request failed with status') ||
    message.startsWith('API Error:') ||
    message === 'Update failed' ||
    message === 'Delete failed'
  ) {
    return fallback;
  }

  return humanizeRecommenderError(message);
};
