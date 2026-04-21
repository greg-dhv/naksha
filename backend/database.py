from supabase import create_client, Client
import os

_url = os.getenv("SUPABASE_URL", "")
_key = os.getenv("SUPABASE_SERVICE_KEY", "")

db: Client = create_client(_url, _key)
