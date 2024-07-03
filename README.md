## Map Miner

This project scrapes data from Google Maps based on a user-provided search query. The script navigates through Google Maps search results, extracts relevant information such as business name, address, website, and contact number, and saves the data into a CSV file.

### Features

- Interactive input for the search query.
- Automated scrolling to load all search results.
- Retry mechanism for handling navigation timeouts.
- Extracts and saves data into a CSV file.

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/google-maps-scraper.git
cd google-maps-scraper
```
2. Install the required dependencies:
```bash
npm install puppeteer json2csv readline
```
3. Run the script:
```bash
node index.js
```
4. Enter the search query when prompted:
```bash
Enter the search query: hospitals in chicago
```
The script will navigate to Google Maps, extract the relevant data, and save it to data.csv in the project directory.

Example Output
The data.csv file will contain data in the following format:

![image](https://github.com/trisweta/map-miner/assets/92795084/ca177fab-38a7-41a0-a223-5013392b28fe)
