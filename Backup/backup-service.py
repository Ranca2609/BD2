from flask import Flask, request, jsonify
import subprocess
import os
from datetime import datetime
from pymongo import MongoClient
import pyodbc
from pydrive.auth import GoogleAuth
from pydrive.drive import GoogleDrive

app = Flask(__name__)

# Directorio donde se guardarán los backups
BACKUP_DIR = "./backups"
os.makedirs(BACKUP_DIR, exist_ok=True)

# Configuración de MongoDB
mongoURI = 'mongodb://localhost:27017/miBaseDocumentos'
mongo_client = MongoClient(mongoURI)

# Configuración SQL Server
sqlConfig = {
    'user': 'sa',
    'password': 'Password123!',
    'database': 'MiUniversidad',
    'server': 'localhost',
    'port': 1433,
    'options': {
        'encrypt': False,
        'trustServerCertificate': True
    }
}

# Configurar Google Drive
gauth = GoogleAuth()
gauth.LoadClientConfigFile('credentials.json')

# Usa autenticación basada en línea de comandos
gauth.CommandLineAuth()
drive = GoogleDrive(gauth)

@app.route('/backup', methods=['POST'])
def create_backup():
    data = request.json
    sql_server_db = data.get('sql_server_db')
    mongo_collection = data.get('mongo_collection')

    response = {}

    # Backup de SQL Server
    if sql_server_db:
        try:
            sql_backup_file = os.path.abspath(os.path.join(BACKUP_DIR, f"{sql_server_db}_backup_{datetime.now().strftime('%Y%m%d%H%M%S')}.bak"))
            sql_command = f"sqlcmd -S {sqlConfig['server']} -U {sqlConfig['user']} -P {sqlConfig['password']} -Q \"BACKUP DATABASE [{sql_server_db}] TO DISK=N'{sql_backup_file}' WITH FORMAT\""
            subprocess.run(sql_command, shell=True, check=True)
            response['sql_server_backup'] = f"Backup completado: {sql_backup_file}"

            # Subir a Google Drive
            folder_id = None
            # Buscar o crear carpeta "Backups" en Google Drive
            file_list = drive.ListFile({'q': "'root' in parents and trashed=false and title='Backups'"}).GetList()
            if file_list:
                folder_id = file_list[0]['id']
            else:
                folder_metadata = {
                    'title': 'Backups',
                    'mimeType': 'application/vnd.google-apps.folder'
                }
                folder = drive.CreateFile(folder_metadata)
                folder.Upload()
                folder_id = folder['id']

            file_drive = drive.CreateFile({"title": os.path.basename(sql_backup_file), "parents": [{"id": folder_id}]})
            file_drive.SetContentFile(sql_backup_file)
            file_drive.Upload()
            response['sql_server_backup_drive'] = f"Backup subido a Google Drive en carpeta 'Backups': {file_drive['id']}"
        except subprocess.CalledProcessError as e:
            response['sql_server_backup'] = f"Error en el comando SQL: {e.output}"
        except Exception as e:
            response['sql_server_backup'] = f"Error: {str(e)}"

    # Backup de MongoDB
    if mongo_collection:
        try:
            mongo_backup_dir = os.path.join(BACKUP_DIR, f"mongo_{mongo_collection}_backup_{datetime.now().strftime('%Y%m%d%H%M%S')}")
            os.makedirs(mongo_backup_dir, exist_ok=True)
            db = mongo_client.get_default_database()
            collection = db[mongo_collection]
            backup_data = list(collection.find())
            backup_file = os.path.join(mongo_backup_dir, f"{mongo_collection}_backup.json")
            with open(backup_file, 'w') as f:
                import json
                json.dump(backup_data, f, default=str)
            response['mongo_backup'] = f"Backup completado: {backup_file}"

            # Subir a Google Drive
            folder_id = None
            # Buscar o crear carpeta "Backups" en Google Drive
            file_list = drive.ListFile({'q': "'root' in parents and trashed=false and title='Backups'"}).GetList()
            if file_list:
                folder_id = file_list[0]['id']
            else:
                folder_metadata = {
                    'title': 'Backups',
                    'mimeType': 'application/vnd.google-apps.folder'
                }
                folder = drive.CreateFile(folder_metadata)
                folder.Upload()
                folder_id = folder['id']

            file_drive = drive.CreateFile({"title": os.path.basename(backup_file), "parents": [{"id": folder_id}]})
            file_drive.SetContentFile(backup_file)
            file_drive.Upload()
            response['mongo_backup_drive'] = f"Backup subido a Google Drive en carpeta 'Backups': {file_drive['id']}"
        except Exception as e:
            response['mongo_backup'] = f"Error: {str(e)}"

    return jsonify(response)

if __name__ == '__main__':
    app.run(debug=True, port=6000)
