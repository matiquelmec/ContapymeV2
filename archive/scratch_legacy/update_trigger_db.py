"""Compatibility wrapper for the treasury trigger update.

The treasury accounting trigger depends on table constraints, helper
functions, indexes and validation triggers defined in migration 19. Applying
only the trigger body can leave production in an inconsistent state, so this
script now delegates to the full migration applier.
"""

from apply_migration_19 import main


if __name__ == "__main__":
    main()
