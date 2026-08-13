This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## 환경 변수 (Gemini)

`.env.example` 를 `.env.local` 로 복사하고 키를 채운다. `.env.local` 은 `.gitignore` 에 걸려 있어
커밋되지 않는다. 키를 코드나 `.env.example` 에 직접 적지 않는다.

```bash
cp .env.example .env.local
```

| 변수 | 필수 | 설명 |
| --- | --- | --- |
| `GEMINI_API_KEY` | ✅ | [Google AI Studio](https://aistudio.google.com/apikey) 에서 발급 |
| `GEMINI_MODEL` | ⬜ | 비우면 `gemini-3.5-flash-lite` |

키는 서버 라우트(`/api/parse-order`)에서만 읽는다. `NEXT_PUBLIC_` 접두사를 붙이면 브라우저
번들에 그대로 박히므로 절대 붙이지 않는다. Vercel 등에 배포할 때는 대시보드의 Environment
Variables 에 같은 이름으로 넣는다.

키가 없으면 앱은 죽지 않고 목업 응답으로 떨어진다(데모 안전장치).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
