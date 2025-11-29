# autocomplete-cli

Query Google and YouTube autocomplete suggestions from the terminal.

## Install

```bash
npm install -g .
```

## Usage

```bash
autocomplete google <query> [options]
autocomplete youtube <query> [options]
```

### Options

| Flag | Description |
|------|-------------|
| `-l, --lang <code>` | Language code (e.g., `en`, `de`, `es`) |
| `-c, --country <code>` | Country code (e.g., `us`, `uk`, `in`) |

## Examples

```bash
# Google suggestions
autocomplete google "best laptop"

# YouTube suggestions
autocomplete youtube "how to edit video"

# With language/country
autocomplete google "mejores laptops" --lang es --country mx
```

## Output

```
$ autocomplete google "best laptop"
best laptop 2024
best laptop for students
best laptop under 500
best laptop for gaming
```

## Development

```bash
npm install      # Install dependencies
npm run build    # Compile TypeScript
npm test         # Run tests
```

## License

MIT
