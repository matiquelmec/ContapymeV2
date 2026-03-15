import os
import shutil

ENGINE_DIR = r"c:\Users\Matías Riquelme\Desktop\Contapymepuq\engine"
APP_DIR = r"c:\Users\Matías Riquelme\Desktop\Contapymepuq\app"

TARGET_OBJS = [
    "accounts_summary.json",
    "all_orgs_debug.json",
    "db_summary.json",
    "members_summary.json",
    "engine_stderr.log",
    "engine_stdout.log",
    "error.log",
    "server.log",
    "pdf_content.txt",
    "schema_dump.txt",
    "temp_test.pdf"
]

SCRIPTS = [
    "apply_sql.py",
    "apply_sql_migration.py",
    "apply_sql_rpc.py",
    "apply_via_rpc.py",
    "apply_world_class_schema.py",
    "atomic_reset.py",
    "check_cols_rest.py",
    "check_db_v2.py",
    "check_schema.py",
    "check_templates.py",
    "check_terminations_schema.py",
    "check_world_class_schema.py",
    "db_diagnostic.py",
    "debug_config.py",
    "debug_config_v2.py",
    "debug_contract.py",
    "debug_db_direct.py",
    "diagnostic_orgs.py",
    "dump_accounts.py",
    "dump_db.py",
    "dump_members.py",
    "find_account.py",
    "full_debug_account.py",
    "generate_docx_template.py",
    "get_ip.py",
    "hard_scrub.py",
    "init_storage.py",
    "inject_staff.py",
    "list_tables.py",
    "seed_emergency.py",
    "seed_employees.py",
    "seed_final.py",
    "seed_settings.py",
    "seed_v2.py",
    "seed_world_class.py",
    "test_column_existence.py",
    "test_conn.py",
    "test_contract.py",
    "test_db.py",
    "test_db_conn.py",
    "test_payroll.py",
    "tmp_create_user.py"
]

def clean_engine():
    dev_tools_dir = os.path.join(ENGINE_DIR, "dev_tools")
    if not os.path.exists(dev_tools_dir):
        os.makedirs(dev_tools_dir)

    for item in TARGET_OBJS:
        p = os.path.join(ENGINE_DIR, item)
        if os.path.exists(p):
            os.remove(p)
            print(f"Removed: {item}")
            
    for script in SCRIPTS:
        p = os.path.join(ENGINE_DIR, script)
        if os.path.exists(p):
            shutil.move(p, os.path.join(dev_tools_dir, script))
            print(f"Moved {script} to dev_tools")

def remove_dup_git():
    app_git = os.path.join(APP_DIR, ".git")
    if os.path.exists(app_git):
        import stat
        # Handle readonly files in .git
        def rm_error(func, path, exc_info):
            os.chmod(path, stat.S_IWRITE)
            func(path)
        shutil.rmtree(app_git, onerror=rm_error)
        print("Removed /app/.git")

if __name__ == "__main__":
    clean_engine()
    remove_dup_git()
    print("Cleanup done.")
