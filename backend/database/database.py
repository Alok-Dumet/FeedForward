import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()
db = psycopg2.connect(os.environ.get("DATABASE_URL"))

#Please remember to do the following in any file you want to query the database in:
#   from database.database import db