
# api/config.py
import os

def get_settings():
    return {
        "db_connection_name": os.environ["DB_CONNECTION_NAME"],
        "db_name": os.environ["DB_NAME"],
        "db_user": os.environ["DB_USER"],
        "db_password": os.environ["DB_PASSWORD"],
    }