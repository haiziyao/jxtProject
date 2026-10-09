export const BODY_PREFIX = "__EXPERIMENT_BODY_MARKDOWN__\n";
export function resolveDocument<T extends { id: number; content: string }>(notes: T[]) {
  const body = notes.find(note => note.content.startsWith(BODY_PREFIX));
  return { bodyNoteId: body?.id ?? null, markdown: body?.content.slice(BODY_PREFIX.length) ?? "", remarks: notes.filter(note => note.id !== body?.id).map(note => ({ ...note, content: note.content.startsWith(BODY_PREFIX) ? note.content.slice(BODY_PREFIX.length) : note.content })) };
}
export function documentFilename(title: string) {
  return (title.replace(/[<>:"/\\|?*\u0000-\u001f]/g, "-").trim().slice(0, 100) || "实验记录") + ".md";
}
