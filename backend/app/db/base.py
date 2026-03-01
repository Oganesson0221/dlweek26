from sqlmodel import SQLModel

# Import model modules so SQLModel registers tables
from app.models import academic  # Backend 2
# from app.models import tracking  # Backend 3
# from app.models import ai        # Backend 1

__all__ = ["SQLModel"]