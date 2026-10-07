import { csvCell, csvRow, CSV_BOM } from "../csv"

describe("CSV Utility", () => {
  describe("csvCell", () => {
    it("handles null and undefined", () => {
      expect(csvCell(null)).toBe("")
      expect(csvCell(undefined)).toBe("")
    })

    it("formats Date as ISO string", () => {
      const d = new Date("2026-10-06T12:00:00.000Z")
      expect(csvCell(d)).toBe("2026-10-06T12:00:00.000Z")
    })

    it("handles plain values without quoting", () => {
      expect(csvCell("plain text")).toBe("plain text")
      expect(csvCell(42)).toBe("42")
      expect(csvCell(true)).toBe("true")
    })

    it("guards against formula injection for strings", () => {
      expect(csvCell("=SUM(A1:A10)")).toBe("'=SUM(A1:A10)")
      expect(csvCell("+1")).toBe("'+1")
      expect(csvCell("-5")).toBe("'-5")
      expect(csvCell("@cmd")).toBe("'@cmd")
      expect(csvCell("\tTabbed")).toBe("'\tTabbed")
      expect(csvCell("\rCarriage")).toBe('"\'\rCarriage"')
    })

    it("does not guard numeric negative values", () => {
      expect(csvCell(-5)).toBe("-5")
      expect(csvCell(BigInt(-10))).toBe("-10")
    })

    it("wraps and escapes strings containing quotes, commas, or newlines", () => {
      expect(csvCell('He said "Hello"')).toBe('"He said ""Hello"""')
      expect(csvCell("Apples, Oranges")).toBe('"Apples, Oranges"')
      expect(csvCell("Line 1\nLine 2")).toBe('"Line 1\nLine 2"')
      expect(csvCell("Line 1\rLine 2")).toBe('"Line 1\rLine 2"')
      
      // Combine formula guard and quoting
      expect(csvCell('=SUM("A1,A2")')).toBe('"' + "'=SUM(\"\"A1,A2\"\")" + '"')
    })
  })

  describe("csvRow", () => {
    it("joins cells with commas and appends crlf", () => {
      const row = csvRow(["A", 1, null, "Hello, World", -5])
      expect(row).toBe('A,1,,"Hello, World",-5\r\n')
    })
  })
})
