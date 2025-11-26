"""
Google Sheets connection service (ported from old_app)
"""

from google.oauth2.service_account import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from typing import Optional, Dict, Any
import pandas as pd

from app.core.config import settings
from app.core.logger import etl_logger


class GoogleSheetsConnection:
    """Google Sheets connection manager"""
    
    def __init__(self):
        self.service = None
        self.logger = etl_logger.logger.getChild("GoogleSheets")
    
    def connect(self) -> bool:
        """Establish connection to Google Sheets API"""
        try:
            credentials = Credentials.from_service_account_file(
                settings.google_sheets.credentials_file, 
                scopes=settings.google_sheets.scopes
            )
            
            self.service = build('sheets', 'v4', credentials=credentials)
            self.logger.info("✅ Google Sheets API credentials loaded successfully")
            return True
            
        except Exception as e:
            self.logger.error(f"❌ Failed to load Google credentials: {e}")
            return False
    
    def create_sheet_if_not_exists(self, sheet_name: str) -> bool:
        """Create a new sheet if it doesn't exist"""
        try:
            # Get existing sheets
            spreadsheet = self.service.spreadsheets().get(
                spreadsheetId=settings.google_sheets.sheet_id
            ).execute()
            
            existing_sheets = [sheet['properties']['title'] for sheet in spreadsheet['sheets']]
            
            if sheet_name not in existing_sheets:
                # Create new sheet
                request = {
                    'addSheet': {
                        'properties': {
                            'title': sheet_name
                        }
                    }
                }
                
                self.service.spreadsheets().batchUpdate(
                    spreadsheetId=settings.google_sheets.sheet_id,
                    body={'requests': [request]}
                ).execute()
                
                self.logger.info(f"✅ Created new sheet: {sheet_name}")
            
            return True
            
        except Exception as e:
            self.logger.error(f"❌ Failed to create sheet {sheet_name}: {e}")
            return False
    
    def _is_sheet_empty(self, sheet_name: str) -> bool:
        """Check if a sheet is empty"""
        try:
            # Try to get data from A1:A1 to see if there's any content
            result = self.service.spreadsheets().values().get(
                spreadsheetId=settings.google_sheets.sheet_id,
                range=f"{sheet_name}!A1:A1"
            ).execute()
            
            values = result.get('values', [])
            return len(values) == 0 or (len(values) == 1 and len(values[0]) == 0)
            
        except HttpError:
            # If we can't read the sheet, assume it's empty
            return True
    
    def _get_next_empty_row(self, sheet_name: str) -> int:
        """Find the next empty row in the sheet"""
        try:
            # Get all data to find the last row with content
            result = self.service.spreadsheets().values().get(
                spreadsheetId=settings.google_sheets.sheet_id,
                range=f"{sheet_name}!A:A"
            ).execute()
            
            values = result.get('values', [])
            # Return the row number after the last row with data (1-indexed)
            return len(values) + 1
            
        except HttpError:
            # If we can't read the sheet, start from row 1
            return 1
    
    def upload_dataframe(self, df: pd.DataFrame, sheet_name: str) -> Optional[int]:
        """Upload DataFrame to Google Sheets - append if sheet has data, otherwise add headers"""
        try:
            # Create sheet if it doesn't exist
            if not self.create_sheet_if_not_exists(sheet_name):
                return None
            
            # Convert DataFrame to list of lists
            def convert_to_string(value):
                if value is None or pd.isna(value) or value == 'nan' or value == 'None':
                    return ""
                elif hasattr(value, 'strftime'):  # Date/datetime objects
                    return str(value)
                elif isinstance(value, (int, float)):
                    # Check if it's a float that represents an integer
                    if isinstance(value, float) and value.is_integer():
                        return str(int(value))  # Convert 123.0 to "123"
                    else:
                        return str(value)  # Keep actual floats as floats
                elif isinstance(value, str):
                    # Handle string representations of numbers
                    try:
                        float_val = float(value)
                        if float_val.is_integer():
                            return str(int(float_val))  # Convert "123.0" to "123"
                        else:
                            return str(float_val)  # Keep "123.45" as "123.45"
                    except (ValueError, TypeError):
                        return str(value)  # Return as string if not a number
                else:
                    return str(value)
            
            # Convert all values to strings
            df_converted = df.map(convert_to_string)
            
            # Check if sheet is empty by trying to get existing data
            is_sheet_empty = self._is_sheet_empty(sheet_name)
            
            if is_sheet_empty:
                # Sheet is empty - add headers with data
                data = [df_converted.columns.tolist()] + df_converted.values.tolist()
                range_name = f"{sheet_name}!A1"
                self.logger.info(f"📝 Sheet '{sheet_name}' is empty - adding headers with data")
            else:
                # Sheet has data - append only data rows (no headers)
                data = df_converted.values.tolist()
                # Find the next empty row to append to
                next_row = self._get_next_empty_row(sheet_name)
                range_name = f"{sheet_name}!A{next_row}"
                self.logger.info(f"📝 Sheet '{sheet_name}' has data - appending {len(data)} rows starting at row {next_row}")
            
            # Upload data
            body = {
                'values': data
            }
            
            result = self.service.spreadsheets().values().update(
                spreadsheetId=settings.google_sheets.sheet_id,
                range=range_name,
                valueInputOption='RAW',
                body=body
            ).execute()
            
            cells_updated = result.get('updatedCells', 0)
            action = "added with headers" if is_sheet_empty else "appended"
            self.logger.info(f"✅ Data {action} to sheet '{sheet_name}': {cells_updated} cells updated")
            return cells_updated
            
        except HttpError as e:
            self.logger.error(f"❌ Google Sheets API error: {e}")
            return None
        except Exception as e:
            self.logger.error(f"❌ Failed to upload to sheets: {e}")
            return None
    
    def get_sheet_info(self) -> Dict[str, Any]:
        """Get information about the spreadsheet"""
        try:
            spreadsheet = self.service.spreadsheets().get(
                spreadsheetId=settings.google_sheets.sheet_id
            ).execute()
            
            return {
                'title': spreadsheet['properties']['title'],
                'sheets': [sheet['properties']['title'] for sheet in spreadsheet['sheets']],
                'spreadsheet_id': settings.google_sheets.sheet_id
            }
            
        except Exception as e:
            self.logger.error(f"❌ Failed to get sheet info: {e}")
            return {}

