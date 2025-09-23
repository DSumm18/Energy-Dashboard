# Energy Consumption Dashboard

A modern, responsive energy consumption dashboard for academic trust schools that connects to Google Sheets for real-time data visualization.

## Features

- 📊 **Real-time Data**: Connects to Google Sheets for live energy consumption data
- 🏫 **Multi-School Support**: Monitor energy usage across multiple schools in your trust
- ⚡ **Energy Types**: Track both electricity and gas consumption
- 📈 **Interactive Charts**: Beautiful charts showing trends and comparisons
- 🔍 **Advanced Filtering**: Filter by school, meter, energy type, and date ranges
- 📱 **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- 🔄 **Auto-refresh**: Manual refresh button to get latest data

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Copy the example environment file and add your Google Sheets credentials:

```bash
cp env.example .env.local
```

Edit `.env.local` and add your Google Sheets API key and spreadsheet ID:

```env
GOOGLE_SHEETS_API_KEY=your_google_sheets_api_key_here
GOOGLE_SHEETS_ID=your_google_sheets_id_here
```

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
| School Name | Energy Type | Year | Month | Total kWh |
|-------------|-------------|------|-------|-----------|
| School A | Electricity | 2024 | January | 1500.5 |
| School A | Electricity | 2024 | February | 1650.2 |

## Features in Detail

### Filtering Options
- **School**: Filter by specific school or view all
- **Meter**: Filter by specific meter (MPAN) or view all
- **Energy Type**: Filter by Electricity, Gas, or both
- **Date Range**: Select custom date ranges or compare specific months

### Charts
- **Monthly Trend**: Line chart showing consumption over time
- **School Comparison**: Bar chart comparing total consumption by school

### KPIs
- **Total Consumption**: Sum of all filtered data
- **Average Monthly**: Average consumption per month
- **Active Meters**: Number of meters reporting data

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
