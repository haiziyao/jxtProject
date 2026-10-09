import { isCalendarDate } from "@/lib/dates";
import { fitsText } from "@/lib/request-body";

export const BODY_MARKDOWN_PREFIX = "__EXPERIMENT_BODY_MARKDOWN__\n";
export function validId(value: unknown): boolean {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0 && value <= 2147483647;
}
export function validateExperiment(input: Record<string, unknown>, partial = false): string | null {
  for (const [field, max] of [["title", 200], ["recorder", 50], ["summary", 60000]] as const) {
    const value = input[field];
    if (partial && value === undefined) continue;
    if (typeof value !== "string" || !value.trim() || value.length > max) return `${field} 格式不正确`;
  }
  if (typeof input.summary === "string" && !fitsText(input.summary)) return "简介超过数据库容量，请缩短内容";
  if ((!partial || input.expDate !== undefined) && !isCalendarDate(input.expDate)) return "实验日期不正确";
  if (input.tagIds !== undefined && (!Array.isArray(input.tagIds) || input.tagIds.some(id => !validId(id)))) return "标签编号不正确";
  if (Array.isArray(input.tagIds) && new Set(input.tagIds).size !== input.tagIds.length) return "标签编号不能重复";
  if (input.bodyMarkdown !== undefined && (typeof input.bodyMarkdown !== "string" || input.bodyMarkdown.length > 2000000)) return "正文格式不正确";
  if (input.bodyNoteId !== undefined && input.bodyNoteId !== null && !validId(input.bodyNoteId)) return "笔记编号不正确";
  return null;
}
