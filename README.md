# Energy Consumption Dashboard

A modern, responsive energy consumption dashboard for academic trust schools that connects to Google Sheets for real-time data visualization.

## Features

- 📊 **Real-time Data**: Connects to Google Sheets for live energy consumption and spend data
- 📥 **Invoice Extraction**: Scan energy invoices stored in Google Drive folders and convert them into structured records using Gemini AI
- 🏫 **Multi-School Support**: Monitor energy usage across multiple schools in your trust
- ⚡ **Energy Types**: Track both electricity and gas consumption
- ☁️ **Google Drive Sync**: Automatically ingest new invoices dropped into a shared Drive folder
- 📈 **Interactive Charts**: Visualise trends for both consumption and financial performance
- 🔍 **Advanced Filtering**: Filter by school, meter, energy type, and date ranges
- 🚨 **Anomaly Detection**: Highlight unusual usage or spend patterns for rapid investigation
- 📱 **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- 🔄 **Auto-refresh**: Manual refresh and Drive import buttons to keep data fresh

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Copy the example environment file and add your credentials:

```bash
cp env.example .env.local
```

Edit `.env.local` and add your configuration values. At minimum you need your spreadsheet ID and either an API key (read-only) or a service account (read/write):

```env
# Google Sheets (existing dashboard data)
GOOGLE_SHEETS_ID=your_google_sheets_id_here
GOOGLE_SHEETS_API_KEY=optional_public_api_key_for_readonly_access

# Google Drive invoice extraction
GOOGLE_SERVICE_ACCOUNT_EMAIL=service-account@project.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_DRIVE_INVOICE_FOLDER_ID=drive_folder_id_with_invoices
GOOGLE_DRIVE_FOLDER_ID=drive_folder_id_with_school_subfolders

# Gemini AI for invoice processing
GENAI_API_KEY=your_gemini_api_key
GEMINI_API_KEY=your_gemini_api_key_here
# Optional overrides
GENAI_MODEL=gemini-1.5-pro
```

> **Note:** The service account must be granted **Viewer** access to the Drive folder that contains the school subfolders. Remember to escape newline characters in the private key when storing it in environment files.

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the dashboard.

## Google Sheets Setup

### 1. Create a Google Sheets Spreadsheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new spreadsheet
3. Copy the spreadsheet ID from the URL (the long string between `/d/` and `/edit`)

### 2. Set Up Your Data Structure

#### Meters Sheet
Create a sheet named "Meters" with the following columns:
- **A**: School Name
- **B**: Address
- **C**: MPAN (Meter Point Administration Number)
- **D**: Energy Type (Electricity/Gas)
- **E**: Meter Number

#### Individual Meter Sheets
For each meter, create a sheet named with the MPAN containing:
- **A**: School Name
- **B**: Energy Type
- **C**: Year
- **D**: Month
- **E**: Total kWh
- **F**: Total Cost (£) — optional but required for financial insights

### 3. Enable Google Sheets API

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing one
3. Enable the Google Sheets API
4. Create credentials (API Key)
5. Restrict the API key to Google Sheets API only
6. Add your domain to the allowed referrers (for production)

### 4. Make Your Sheet Public (Read-Only)

1. In your Google Sheet, click "Share"
2. Change permissions to "Anyone with the link can view"
3. Copy the link and extract the spreadsheet ID

## Automated Google Drive Ingestion

The dashboard can automatically pull new invoices from a shared Google Drive folder, extract their key fields using Gemini, and push the results into your Google Sheet.

1. **Service account access**
   - Share the target Drive folder and the Google Sheet with the service account email you configure in `.env.local`.
   - Grant at least "Viewer" access to the folder and "Editor" access to the spreadsheet so the app can append/update rows.
2. **Folder structure**
   - Drop invoices into subfolders named after the school (e.g. `/Invoices/Hollingwood Primary/September-2024.pdf`).
   - The sync job uses the immediate parent folder name to tag the school in the dashboard.
3. **Triggering a sync**
   - Click **“Sync invoices from Drive”** in the dashboard header to process any new PDFs or images.
   - Successful extractions are written to the relevant meter tab and the files are tagged as processed in Drive via `appProperties`.
4. **Gemini configuration**
   - Provide a `GENAI_API_KEY` with access to the Gemini API. `GENAI_MODEL` defaults to `gemini-1.5-flash` but can be overridden.
   - The extraction schema returns totals, meter references and consumption figures; ensure your invoices contain these fields for best results.

## Deployment

### Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard:
   - `GOOGLE_SHEETS_API_KEY`
   - `GOOGLE_SHEETS_ID`
4. Deploy!

### Manual Deployment

```bash
npm run build
npm start
```

## Data Format

The dashboard expects your Google Sheets to follow this structure:

### Meters Sheet (Tab: "Meters")
| School Name | Address | MPAN | Energy Type | Meter Number |
|-------------|---------|------|-------------|--------------|
| School A | 123 Main St | 1234567890 | Electricity | METER001 |
| School B | 456 Oak Ave | 0987654321 | Gas | METER002 |

### Individual Meter Sheets (Tab: MPAN)
| School Name | Energy Type | Year | Month | Total kWh | Total Cost (£) |
|-------------|-------------|------|-------|-----------|----------------|
| School A | Electricity | 2024 | January | 1500.5 | 275.09 |
| School A | Electricity | 2024 | February | 1650.2 | 301.54 |

## Features in Detail

### Filtering Options
- **School**: Filter by specific school or view all
- **Meter**: Filter by specific meter (MPAN) or view all
- **Energy Type**: Filter by Electricity, Gas, or both
- **Date Range**: Select custom date ranges or compare specific months

### Charts
- **Monthly Trend**: Line chart showing consumption over time
- **Energy Spend Trend**: Track how monthly costs move alongside consumption
- **School Comparison**: Bar chart comparing total consumption by school
- **Spend by School**: Highlight where the largest invoices are landing

### KPIs
- **Total Consumption**: Sum of all filtered data
- **Total Spend**: Financial impact of the current selection (credits included)
- **Average Monthly**: Average consumption per month
- **Cost Intensity**: Average £/kWh and active meter count

### Intelligence
- **Anomaly Alerts**: Surface usage or spend outliers using Z-score analysis
- **Drive Sync Status**: Get immediate feedback on how many invoices were ingested

## Troubleshooting

### Common Issues

1. **"Failed to fetch data" error**
   - Check your Google Sheets API key
   - Ensure the spreadsheet ID is correct
   - Verify the sheet is publicly accessible

2. **Empty data**
   - Check your sheet structure matches the expected format
   - Ensure data is in the correct columns
   - Verify sheet names match exactly

3. **Charts not displaying**
   - Check browser console for JavaScript errors
   - Ensure data is properly formatted (numbers for kWh values)

### Development Mode

If you don't have Google Sheets set up yet, the dashboard will automatically use mock data for development and testing.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support or questions, please open an issue in the GitHub repository.
## Google Drive Invoice Extraction

The `POST /api/drive-extraction` endpoint connects to a Google Drive folder and extracts structured invoice data using Gemini.

1. Create a parent Drive folder (e.g., `AA Energy Bills`).
2. Inside that folder create one subfolder per school (the subfolder name becomes the `siteName`).
3. Upload PDF or image invoices/credit notes into the relevant school folders.
4. Share the parent folder with the service account email set in `GOOGLE_SERVICE_ACCOUNT_EMAIL` (Viewer access is sufficient).

To trigger extraction, send a POST request:

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"folderId":"optional_override_folder_id"}' \
  http://localhost:3000/api/drive-extraction
```

If `folderId` is omitted, the API uses `GOOGLE_DRIVE_FOLDER_ID` from the environment. The response includes:

- `records`: Array of structured invoice objects ready for persistence.
- `processedCount`: Number of successfully extracted documents.
- `errorCount` & `errors`: Details for any files that could not be processed.

You can connect this endpoint to your frontend extractor workflow or schedule it as a server-side job to keep invoice data synchronized automatically.

