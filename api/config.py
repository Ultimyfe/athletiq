# import os
# from functools import lru_cache

# from google.cloud import secretmanager


# def _access_secret(project_id: str, secret_id: str) -> str:
#     """
#     Secret Manager: projects/{project}/secrets/{secret}/versions/latest を読む
#     Cloud Run上ではサービスアカウント権限で読める
#     ローカルでは gcloud auth application-default login が必要
#     """
#     client = secretmanager.SecretManagerServiceClient()
#     name = f"projects/{project_id}/secrets/{secret_id}/versions/latest"
#     resp = client.access_secret_version(request={"name": name})
#     return resp.payload.data.decode("utf-8")


# @lru_cache
# def get_settings() -> dict:
#     """
#     取得したい4つのシークレット:
#     - DB_NAME
#     - DB_USER
#     - DB_PASSWORD
#     - DB_CONNECTION_NAME
#     """
#     project_id = os.environ.get("GCP_PROJECT")
#     if not project_id:
#         # Cloud Runでは通常 GOOGLE_CLOUD_PROJECT が入るのでフォールバック
#         project_id = os.environ.get("GOOGLE_CLOUD_PROJECT")

#     if not project_id:
#         raise RuntimeError("GCP_PROJECT / GOOGLE_CLOUD_PROJECT が環境変数にありません")

#     db_name = _access_secret(project_id, "DB_NAME")
#     db_user = _access_secret(project_id, "DB_USER")
#     db_password = _access_secret(project_id, "DB_PASSWORD")
#     db_connection_name = _access_secret(project_id, "DB_CONNECTION_NAME")

#     return {
#         "project_id": project_id,
#         "db_name": db_name,
#         "db_user": db_user,
#         "db_password": db_password,
#         "db_connection_name": db_connection_name,
#     }

# api/config.py
import os

def get_settings():
    return {
        "db_connection_name": os.environ["DB_CONNECTION_NAME"],
        "db_name": os.environ["DB_NAME"],
        "db_user": os.environ["DB_USER"],
        "db_password": os.environ["DB_PASSWORD"],
    }