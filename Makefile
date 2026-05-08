.PHONY: help install-hooks dev build test test-integration smoke lint fmt pages-preview data release clean hooks-pre-commit hooks-commit-msg hooks-pre-push

help:
	@printf "%s\n" \
		"make install-hooks     Wire local git hooks" \
		"make dev               Run the Vite development server" \
		"make build             Build the GitHub Pages site into docs/" \
		"make test              Run unit tests" \
		"make test-integration  Run integration tests (none in Mode A v1)" \
		"make smoke             Build and run Playwright smoke tests" \
		"make lint              Run linters" \
		"make fmt               Format files" \
		"make pages-preview     Serve docs/ as GitHub Pages would" \
		"make data              No-op for Mode A" \
		"make release           Tag v$$(node -p \"require('./package.json').version\")" \
		"make clean             Remove generated local artifacts"

install-hooks:
	npm run install-hooks

dev:
	npm run dev

build:
	npm run build

test:
	npm test

test-integration:
	@echo "No integration suite is required for Mode A v1."

smoke:
	npm run smoke

lint:
	npm run lint

fmt:
	npm run fmt

pages-preview:
	npm run pages-preview

data:
	@echo "Mode A has no offline data pipeline."

release:
	git tag v$$(node -p "require('./package.json').version")

clean:
	rm -rf node_modules/.tmp coverage playwright-report test-results

hooks-pre-commit:
	npm run hooks-pre-commit

hooks-commit-msg:
	npm run hooks-commit-msg

hooks-pre-push:
	npm run hooks-pre-push
