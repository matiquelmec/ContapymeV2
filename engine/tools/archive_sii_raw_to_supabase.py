"""
Archive large `sii_raw_response` values: upload full bodies to Supabase Storage
and create `dte_sii_raw_archive` rows, then replace `dte_issued.sii_raw_response`
with a truncated summary and store the storage path in `sii_raw_response_path`.

Usage (example):
  set DATABASE_URL=postgres://user:pass@host:5432/db
  set SUPABASE_URL=https://xyz.supabase.co
  set SUPABASE_KEY=eyJ...
  set SUPABASE_BUCKET=dte-raw-archive
  python engine/tools/archive_sii_raw_to_supabase.py --threshold 65536 --batch 50 --dry-run

The script supports a `--dry-run` mode and a `--storage` toggle. If Supabase
env vars are missing or `--storage` is false, the script will fallback to
inserting the full body into `dte_sii_raw_archive.storage_path` as NULL and keep
only the truncated summary in `dte_issued.sii_raw_response`.
"""
import os
import argparse
import uuid
import io
import json
from typing import Optional

import psycopg2
from psycopg2.extras import RealDictCursor

try:
    from supabase import create_client
except Exception:
    create_client = None


HEAD_TAIL = 8192


def prepare_summary(text: Optional[str], max_len: int = 65536) -> Optional[str]:
    if not text:
        return None
    if len(text) <= max_len:
        return text
    head = text[:HEAD_TAIL]
    tail = text[-HEAD_TAIL:]
    payload = {
        "truncated": True,
        "original_length": len(text),
        "head": head,
        "tail": tail,
    }
    return json.dumps(payload, ensure_ascii=False)


def upload_to_supabase(supabase_url, supabase_key, bucket, path, data_bytes) -> Optional[str]:
    if not create_client:
        raise RuntimeError("supabase package not installed; install supabase-py to use storage upload")
    client = create_client(supabase_url, supabase_key)
    # `upload` expects file-like; behavior may vary by client version
    try:
        res = client.storage.from_(bucket).upload(path, io.BytesIO(data_bytes))
        # construct storage path reference (bucket + path)
        return f"{bucket}/{path}"
    except Exception as e:
        raise


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--threshold", type=int, default=65536)
    p.add_argument("--batch", type=int, default=100)
    p.add_argument("--dry-run", action="store_true")
    p.add_argument("--storage", action="store_true", help="Upload large bodies to Supabase Storage")
    args = p.parse_args()

    database_url = os.getenv("DATABASE_URL")
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_KEY")
    bucket = os.getenv("SUPABASE_BUCKET", "dte_raw_archive")

    use_storage = args.storage and supabase_url and supabase_key and create_client is not None
    if args.storage and not use_storage:
        print("Warning: SUPABASE env vars or library missing; falling back to DB-only archival")

    if not database_url:
        print("Set DATABASE_URL environment variable (postgres connection) and retry")
        return

    conn = psycopg2.connect(database_url)
    cur = conn.cursor(cursor_factory=RealDictCursor)

    fetch_sql = (
        "SELECT id, organization_id, sii_raw_response FROM public.dte_issued "
        "WHERE coalesce(char_length(sii_raw_response),0) > %s ORDER BY id LIMIT %s"
    )

    processed = 0
    while True:
        cur.execute(fetch_sql, (args.threshold, args.batch))
        rows = cur.fetchall()
        if not rows:
            break

        for row in rows:
            dte_id = row["id"]
            org = row.get("organization_id")
            raw = row.get("sii_raw_response") or ""
            orig_len = len(raw)

            filename = f"{org}/{dte_id}_{uuid.uuid4().hex}.xml"
            storage_path = None

            if use_storage and orig_len > 0:
                try:
                    if not args.dry_run:
                        storage_path = upload_to_supabase(supabase_url, supabase_key, bucket, filename, raw.encode("utf-8"))
                    else:
                        storage_path = f"DRYRUN:{bucket}/{filename}"
                except Exception as exc:
                    print(f"Upload failed for {dte_id}: {exc}")
                    storage_path = None

            # prepare archive record values
            head = raw[:HEAD_TAIL]
            tail = raw[-HEAD_TAIL:] if orig_len > HEAD_TAIL else ""

            # transaction per-row for safety
            if args.dry_run:
                print(f"DRY: would archive dte={dte_id} len={orig_len} storage={storage_path}")
            else:
                try:
                    # insert into archive and update dte_issued
                    ins_sql = (
                        "INSERT INTO public.dte_sii_raw_archive (id, dte_id, organization_id, original_length, head, tail, storage_path) "
                        "VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING id"
                    )
                    archive_id = str(uuid.uuid4())
                    cur.execute(ins_sql, (archive_id, dte_id, org, orig_len, head, tail, storage_path))

                    summary = prepare_summary(raw, max_len=args.threshold)
                    upd_sql = (
                        "UPDATE public.dte_issued SET sii_raw_response = %s, sii_raw_response_path = %s, updated_at = now() WHERE id = %s"
                    )
                    cur.execute(upd_sql, (summary, storage_path, dte_id))
                    conn.commit()
                except Exception as e:
                    conn.rollback()
                    print(f"Error archiving {dte_id}: {e}")

            processed += 1

        # loop to next batch

    cur.close()
    conn.close()
    print(f"Processed {processed} rows")


if __name__ == "__main__":
    main()
