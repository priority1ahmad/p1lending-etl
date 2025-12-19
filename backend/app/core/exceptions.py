"""
Custom exception classes for the application
"""

from fastapi import HTTPException, status


class AppException(HTTPException):
    """Base application exception"""

    pass


class AuthenticationError(AppException):
    """Authentication failed"""

    def __init__(self, detail: str = "Authentication failed"):
        super().__init__(status_code=status.HTTP_401_UNAUTHORIZED, detail=detail)


class AuthorizationError(AppException):
    """Authorization failed"""

    def __init__(self, detail: str = "Not enough permissions"):
        super().__init__(status_code=status.HTTP_403_FORBIDDEN, detail=detail)


class NotFoundError(AppException):
    """Resource not found"""

    def __init__(self, detail: str = "Resource not found"):
        super().__init__(status_code=status.HTTP_404_NOT_FOUND, detail=detail)


class ValidationError(AppException):
    """Validation error"""

    def __init__(self, detail: str = "Validation error"):
        super().__init__(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=detail)


class ETLJobError(AppException):
    """ETL job error"""

    def __init__(self, detail: str = "ETL job error"):
        super().__init__(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=detail)
