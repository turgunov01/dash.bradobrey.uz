from __future__ import annotations

import argparse
import pathlib
import re
from dataclasses import dataclass


ROOT = pathlib.Path(__file__).resolve().parents[1]

DEFAULT_SCAN_DIRS = ("app", "server", "shared")
DEFAULT_EXTENSIONS = (
    ".ts",
    ".tsx",
    ".js",
    ".jsx",
    ".mjs",
    ".cjs",
    ".vue",
    ".json",
    ".md",
    ".yml",
    ".yaml",
)

DEFAULT_IGNORED_DIRS = {
    ".git",
    ".github",
    ".nuxt",
    ".output",
    ".pnpm-store",
    "dist",
    "node_modules",
    "public",
}


CHUNK_RE = re.compile(
    r"[\u0009\u0020-\u007E\u0080-\u00FF\u0400-\u04FF\u2010-\u203A]{4,}"
)
CYRILLIC_RE = re.compile(r"[\u0400-\u04FF]")


def to_cp1251_bytes_loose(text: str) -> bytes:
    """
    Convert unicode text to bytes similarly to cp1251 encoding, but keep C1 control
    characters (U+0080..U+009F) as raw bytes. This helps round-trip mojibake that
    contains undefined cp1251 bytes that ended up as control characters.
    """

    out = bytearray()
    for ch in text:
        codepoint = ord(ch)
        if codepoint <= 0xFF:
            out.append(codepoint)
            continue

        out.extend(ch.encode("cp1251"))

    return bytes(out)


def mojibake_score(text: str) -> float:
    letters = sum(1 for ch in text if ch.isalpha())
    if letters == 0:
        return 0.0
    return (text.count("Р") + text.count("С")) / letters


def try_fix_chunk(chunk: str) -> str | None:
    if not chunk:
        return None

    has_control = any(0x80 <= ord(ch) <= 0x9F for ch in chunk)
    chunk_score = mojibake_score(chunk)

    if not has_control and chunk_score < 0.3:
        return None

    try:
        recovered = to_cp1251_bytes_loose(chunk).decode("utf-8")
    except (UnicodeDecodeError, UnicodeEncodeError):
        return None

    if recovered == chunk:
        return None

    if not CYRILLIC_RE.search(recovered):
        return None

    if mojibake_score(recovered) >= chunk_score:
        return None

    return recovered


def fix_text(text: str) -> tuple[str, int]:
    changed = 0

    def repl(match: re.Match[str]) -> str:
        nonlocal changed
        original = match.group(0)
        fixed = try_fix_chunk(original)
        if fixed is None:
            return original
        changed += 1
        return fixed

    return CHUNK_RE.sub(repl, text), changed


@dataclass(frozen=True)
class FixResult:
    path: pathlib.Path
    replacements: int


def should_skip_path(path: pathlib.Path, ignored_dirs: set[str]) -> bool:
    for part in path.parts:
        if part in ignored_dirs:
            return True
    return False


def iter_candidate_files(
    scan_dirs: tuple[str, ...],
    extensions: tuple[str, ...],
    ignored_dirs: set[str],
) -> list[pathlib.Path]:
    files: list[pathlib.Path] = []

    for scan_dir in scan_dirs:
        base = ROOT / scan_dir
        if not base.exists():
            continue

        for path in base.rglob("*"):
            if path.is_dir():
                continue
            if should_skip_path(path, ignored_dirs):
                continue
            if path.suffix.lower() not in extensions:
                continue
            files.append(path)

    return files


def run(
    scan_dirs: tuple[str, ...],
    extensions: tuple[str, ...],
    ignored_dirs: set[str],
    dry_run: bool,
) -> list[FixResult]:
    results: list[FixResult] = []

    for path in iter_candidate_files(scan_dirs, extensions, ignored_dirs):
        try:
            original_text = path.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            continue

        fixed_text, replacements = fix_text(original_text)
        if replacements == 0 or fixed_text == original_text:
            continue

        if not dry_run:
            path.write_text(fixed_text, encoding="utf-8", newline="\n")

        results.append(FixResult(path=path, replacements=replacements))

    return results


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Fix mojibake where UTF-8 bytes were decoded as cp1251 and stored as text."
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Do not write files, only print what would change.",
    )
    parser.add_argument(
        "--dirs",
        nargs="*",
        default=list(DEFAULT_SCAN_DIRS),
        help="Directories to scan (relative to repo root).",
    )

    args = parser.parse_args()
    scan_dirs = tuple(str(d).strip() for d in args.dirs if str(d).strip())
    results = run(
        scan_dirs=scan_dirs,
        extensions=DEFAULT_EXTENSIONS,
        ignored_dirs=set(DEFAULT_IGNORED_DIRS),
        dry_run=bool(args.dry_run),
    )

    for result in results:
        rel = result.path.relative_to(ROOT)
        print(f"{rel}: {result.replacements} replacements")

    print(f"Done. Files changed: {len(results)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
