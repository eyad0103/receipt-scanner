import hashlib
import os
import re
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Union


def clean_text(text: str) -> str:
    text = text.strip()
    text = re.sub(r'\s+', ' ', text)
    text = re.sub(r'[^\w\s.,!?-]', '', text)
    return text


def hash_string(value: str, algorithm: str = 'sha256') -> str:
    hasher = hashlib.new(algorithm)
    hasher.update(value.encode('utf-8'))
    return hasher.hexdigest()


def ensure_directory(path: Union[str, Path]) -> Path:
    dir_path = Path(path)
    dir_path.mkdir(parents=True, exist_ok=True)
    return dir_path


def safe_read_file(path: Union[str, Path], encoding: str = 'utf-8') -> Optional[str]:
    try:
        return Path(path).read_text(encoding=encoding)
    except (OSError, IOError):
        return None


def safe_write_file(path: Union[str, Path], content: str, encoding: str = 'utf-8') -> bool:
    try:
        ensure_directory(Path(path).parent)
        Path(path).write_text(content, encoding=encoding)
        return True
    except (OSError, IOError):
        return False


def format_timestamp(timestamp: Optional[datetime] = None) -> str:
    if timestamp is None:
        timestamp = datetime.now(timezone.utc)
    return timestamp.strftime('%Y-%m-%dT%H:%M:%SZ')


def parse_env_bool(key: str, default: bool = False) -> bool:
    value = os.environ.get(key, str(default)).lower()
    return value in ('true', '1', 'yes', 'on')


def chunk_list(items: List[Any], chunk_size: int) -> List[List[Any]]:
    if chunk_size <= 0:
        raise ValueError('chunk_size must be positive')
    return [items[i:i + chunk_size] for i in range(0, len(items), chunk_size)]


def truncate_string(value: str, max_length: int, suffix: str = '...') -> str:
    if len(value) <= max_length:
        return value
    return value[:max_length - len(suffix)] + suffix


def merge_dicts(base: Dict[str, Any], override: Dict[str, Any]) -> Dict[str, Any]:
    result = base.copy()
    for key, value in override.items():
        if key in result and isinstance(result[key], dict) and isinstance(value, dict):
            result[key] = merge_dicts(result[key], value)
        else:
            result[key] = value
    return result


def normalize_path(path: Union[str, Path]) -> Path:
    return Path(path).resolve()


def get_file_extension(filename: str) -> str:
    return Path(filename).suffix.lower()


def is_valid_email(email: str) -> bool:
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None


def sanitize_filename(filename: str) -> str:
    sanitized = re.sub(r'[<>:"/\\|?*]', '_', filename)
    sanitized = sanitized.strip('. ')
    return sanitized or 'unnamed'