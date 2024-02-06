# calypso

To install dependencies:

```bash
bun install
```

To run w/ hot reload:

```bash
bun run --watch index.ts
```

This project was created using `bun init` in bun v1.0.0. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.

To migrate:
`bunx drizzle-kit generate:sqlite --schema ./src/db/schema.ts`

To run: bunx drizzle-kit studio --verbose
--we had to update the drizzle.config.ts
