import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Rule นี้ (มาจาก React Compiler linting) แจ้ง error กับ pattern มาตรฐาน
      // "อ่านค่าจาก localStorage ตอน mount ผ่าน useEffect" ซึ่งจำเป็นต้องทำแบบนี้
      // เพราะ localStorage ไม่มีอยู่ตอน server-render — ไม่ใช่บั๊กจริง จึงลดเป็น warning แทน
      "react-hooks/set-state-in-effect": "warn",
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;