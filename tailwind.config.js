/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./features/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {},
  },
  safelist: [
    // カラープリセットで動的に使うクラス（NativeWindの解析に引っかからないため）
    'bg-red-500', 'text-white', 'border-red-600',
    'bg-blue-500', 'border-blue-600',
    'bg-green-500', 'border-green-600',
    'bg-amber-500', 'text-black', 'border-amber-600',
    'bg-purple-500', 'border-purple-600',
    'bg-teal-500', 'border-teal-600',
  ],
  plugins: [],
}
