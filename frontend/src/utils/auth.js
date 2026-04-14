export function isAuthed(token) {
  return Boolean(token && token.trim());
}
