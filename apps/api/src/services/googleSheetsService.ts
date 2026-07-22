import { google } from 'googleapis';

const SPREADSHEET_ID = process.env['SPREADSHEET_ID'];
const API_KEY_OR_CREDENTIALS = process.env['GOOGLE_SERVICE_ACCOUNT_KEY'];
console.log(API_KEY_OR_CREDENTIALS)
let sheetsApi: any = null;

if (API_KEY_OR_CREDENTIALS) {
  try {
    if (API_KEY_OR_CREDENTIALS.startsWith('{')) {
      // It's a JSON service account
      const credentials = JSON.parse(API_KEY_OR_CREDENTIALS);
      const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });
      sheetsApi = google.sheets({ version: 'v4', auth });
    } else {
      // It's an API Key (e.g. AIza...)
      sheetsApi = google.sheets({ version: 'v4', auth: API_KEY_OR_CREDENTIALS });
    }
  } catch (error) {
    console.error('Failed to initialize Google Sheets API:', error);
  }
}

export const googleSheetsService = {
  async appendRatingRow(
    orderId: string,
    customerId: string,
    storeId: string,
    totalAmount: number,
    rating: string,
    timestamp: Date
  ) {
    if (!sheetsApi || !SPREADSHEET_ID) {
      console.warn('Google Sheets API is not configured. Skipping export.');
      return;
    }

    try {
      const values = [
        [
          orderId,
          customerId,
          storeId,
          totalAmount.toString(),
          rating,
          timestamp.toISOString(),
        ],
      ];

      await sheetsApi.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Sheet1!A:F',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values,
        },
      });

      console.log(`Successfully exported rating for order ${orderId} to Google Sheets.`);
    } catch (error) {
      console.error('Error appending rating to Google Sheets:', error);
      // We don't throw here to avoid failing the main user request if analytics fails
    }
  },
};
