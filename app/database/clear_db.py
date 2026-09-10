import sqlite3

conn = sqlite3.connect("resqmesh.db")
cur = conn.cursor()

cur.execute("DELETE FROM incident_events")
cur.execute("DELETE FROM incidents")
cur.execute("DELETE FROM events")
cur.execute("DELETE FROM devices")

conn.commit()
conn.close()
print("All tables cleared.")