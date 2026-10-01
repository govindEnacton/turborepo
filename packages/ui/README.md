# Shared shadcn/ui components

Both `apps/web` and `apps/admin` use this package. Components live in
`src/components/ui`, utilities in `src/lib`, and the shared Tailwind v4 theme in
`src/styles/globals.css`.

## Use a component

```tsx
import { Button } from "@repo/ui/components/ui/button";

export default function Example() {
  return <Button variant="outline">Save</Button>;
}
```

For interactive props such as `onClick`, use the component inside a Next.js Client
Component (`"use client"`).

## Add components

Run from the repository root:

```sh
bunx --bun shadcn@latest add card --cwd apps/web
```

The workspace aliases route shared UI components to this package, so they are
available in both apps. You can also run the CLI directly against `packages/ui`:

```sh
bunx --bun shadcn@latest add dialog --cwd packages/ui
```

The existing `components.json` files configure the project; no further `init` is
needed.

## Styling

Each app imports `@repo/ui/globals.css` from its own `app/globals.css` and processes
it with `@tailwindcss/postcss`. The shared stylesheet scans this package's source;
each app's `@source "../"` includes its own components too.

Edit the shared CSS variables to change the theme for both apps. Dark mode follows
the system preference, matching Tailwind's default `dark:` variant. Keep app-only
styles in each app's stylesheet and place element resets in `@layer base` so they
do not override component utilities.
