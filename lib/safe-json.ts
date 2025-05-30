export class SafeJSON {
  static parse<T = any>(text: string, fallback: T): T {
    try {
      if (!text || typeof text !== "string") {
        return fallback
      }
      const parsed = JSON.parse(text)
      return parsed !== null && parsed !== undefined ? parsed : fallback
    } catch (error) {
      console.warn("JSON parse error:", error)
      return fallback
    }
  }

  static stringify(value: any, fallback = "{}"): string {
    try {
      if (value === null || value === undefined) {
        return fallback
      }
      return JSON.stringify(value)
    } catch (error) {
      console.warn("JSON stringify error:", error)
      return fallback
    }
  }

  static safeGet(obj: any, path: string, fallback: any = null): any {
    try {
      if (!obj || typeof obj !== "object") {
        return fallback
      }

      const keys = path.split(".")
      let current = obj

      for (const key of keys) {
        if (current === null || current === undefined || !(key in current)) {
          return fallback
        }
        current = current[key]
      }

      return current !== null && current !== undefined ? current : fallback
    } catch (error) {
      console.warn("Safe get error:", error)
      return fallback
    }
  }

  static validateDate(value: any): Date {
    try {
      if (value instanceof Date && !isNaN(value.getTime())) {
        return value
      }

      if (typeof value === "string" || typeof value === "number") {
        const date = new Date(value)
        if (!isNaN(date.getTime())) {
          return date
        }
      }

      return new Date()
    } catch (error) {
      console.warn("Date validation error:", error)
      return new Date()
    }
  }

  static validateString(value: any, fallback = ""): string {
    try {
      if (typeof value === "string") {
        return value
      }
      if (value !== null && value !== undefined) {
        return String(value)
      }
      return fallback
    } catch (error) {
      console.warn("String validation error:", error)
      return fallback
    }
  }

  static validateNumber(value: any, fallback = 0): number {
    try {
      if (typeof value === "number" && !isNaN(value)) {
        return value
      }
      if (typeof value === "string") {
        const parsed = Number.parseFloat(value)
        if (!isNaN(parsed)) {
          return parsed
        }
      }
      return fallback
    } catch (error) {
      console.warn("Number validation error:", error)
      return fallback
    }
  }
}
