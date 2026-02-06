# UI Style Guide: Forms & Dark Mode

> Part of [UI Style Guide](../UI_STYLE_GUIDE.md)

---

## ✅ Form Field Patterns

### Required Fields

```html
<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
    Field Name <span class="text-red-500">*</span>
</label>
```

### Input/Textarea Classes

```
w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
focus:ring-2 focus:ring-blue-500 focus:border-transparent
dark:bg-gray-700 dark:text-white
placeholder:text-gray-500 dark:placeholder:text-gray-400
```

**CRITICAL**: Always include ALL of these classes together. Missing `dark:text-white` or placeholder classes causes invisible text in dark mode.

---

## 🌗 Dark Mode Requirements (MANDATORY!)

**Every color class MUST have a dark mode counterpart.** This is non-negotiable.

### Dark Mode Checklist

When adding any color class, ask: "What is the dark mode equivalent?"

| Light Mode | Dark Mode Equivalent |
|------------|---------------------|
| `bg-white` | `dark:bg-gray-800` |
| `bg-gray-50` | `dark:bg-gray-900` |
| `bg-gray-100` | `dark:bg-gray-800` |
| `text-gray-900` | `dark:text-white` |
| `text-gray-700` | `dark:text-gray-300` |
| `text-gray-600` | `dark:text-gray-400` |
| `text-gray-500` | `dark:text-gray-400` |
| `border-gray-200` | `dark:border-gray-700` |
| `border-gray-300` | `dark:border-gray-600` |
| `placeholder:text-gray-500` | `dark:placeholder:text-gray-400` |

### Common Dark Mode Mistakes

❌ **WRONG**: Adding light class without dark equivalent
```html
<div class="bg-white text-gray-900">  <!-- Invisible in dark mode! -->
```

✅ **CORRECT**: Always pair light and dark
```html
<div class="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
```

### Status Colors in Dark Mode

| Status | Light Mode | Dark Mode |
|--------|------------|-----------|
| Success Background | `bg-green-50` | `dark:bg-green-900/20` |
| Success Text | `text-green-800` | `dark:text-green-300` |
| Success Border | `border-green-200` | `dark:border-green-800` |
| Error Background | `bg-red-50` | `dark:bg-red-900/20` |
| Error Text | `text-red-800` | `dark:text-red-300` |
| Error Border | `border-red-200` | `dark:border-red-800` |
| Warning Background | `bg-yellow-50` | `dark:bg-yellow-900/20` |
| Warning Text | `text-yellow-800` | `dark:text-yellow-300` |
| Warning Border | `border-yellow-200` | `dark:border-yellow-800` |
