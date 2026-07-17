# API 一览（MVP）

## Auth

- `POST /api/auth/register` { email, password, displayName }
- `POST /api/auth/login` { email, password }
- `POST /api/auth/logout`
- `GET /api/auth/me`

## Journal

- `GET /api/journal`
- `POST /api/journal` { title, content, mood?, tags?, isPrivate? }

## Mood

- `GET /api/mood`
- `POST /api/mood` { score, energy?, stress?, note? }

## AI

- `GET /api/ai/profile`
- `POST /api/ai/profile` 刷新画像
- `POST /api/ai/chat` { message }

## Community

- `GET /api/posts?community=slug`
- `POST /api/posts` { communitySlug, title, content, isAnonymous? }

## Courses

- `GET /api/courses`
- `POST /api/courses` { courseId, status? }
