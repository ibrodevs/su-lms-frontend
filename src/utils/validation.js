export const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const passwordRules = [
  {
    id: "length",
    label: "Минимум 8 символов",
    test: (value) => value.length >= 8,
  },
  {
    id: "uppercase",
    label: "Одна заглавная буква",
    test: (value) => /[A-ZА-ЯЁ]/.test(value),
  },
  {
    id: "lowercase",
    label: "Одна строчная буква",
    test: (value) => /[a-zа-яё]/.test(value),
  },
  {
    id: "number",
    label: "Одна цифра",
    test: (value) => /\d/.test(value),
  },
];

export function isValidPassword(value) {
  return passwordRules.every((rule) => rule.test(value));
}
