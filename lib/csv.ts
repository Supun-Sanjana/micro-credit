export const CSV_BOM = "\uFEFF"

export function csvCell(value: unknown): string {
  if (value === null || value === undefined) {
    return ""
  }

  let s: string
  let isNumericOriginal = false

  if (value instanceof Date) {
    s = value.toISOString()
  } else if (
    typeof value === "object" &&
    value !== null &&
    (value.constructor?.name === "Decimal" || typeof (value as any).toFixed === "function")
  ) {
    s = String(value)
    isNumericOriginal = true
  } else if (typeof value === "object") {
    s = JSON.stringify(value)
  } else {
    s = String(value)
    if (typeof value === "number" || typeof value === "bigint") {
      isNumericOriginal = true
    }
  }

  if (
    !isNumericOriginal &&
    (s.startsWith("=") ||
      s.startsWith("+") ||
      s.startsWith("-") ||
      s.startsWith("@") ||
      s.startsWith("\t") ||
      s.startsWith("\r"))
  ) {
    s = "'" + s
  }

  if (s.includes('"') || s.includes(",") || s.includes("\n") || s.includes("\r")) {
    s = `"${s.replace(/"/g, '""')}"`
  }

  return s
}

export function csvRow(values: unknown[]): string {
  return values.map(csvCell).join(",") + "\r\n"
}
