const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
const port = 3000; // Change this to the desired port number

app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// GET route to serve the HTML form
app.get('/', (req, res) => {
    res.sendFile('indexx.html', { root: __dirname + '/public' });
});

// POST route to handle flight search
app.post('/searchFlights', async (req, res) => {
    const { departureCity, arrivalCity, departureDate, returnDate } = req.body;

    async function searchFlights() {
        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
        await page.setViewport({
            width: 1400,
            height: 680,
            deviceScaleFactor: 1,
        });

        try {
            console.log('Step 1: Go to Google Flights');
            await page.goto('https://www.google.com/travel/flights?tfs=CBwQARoOagwIAhIIL20vMGRsdjBAAUgBcAGCAQsI____________AZgBAg', { waitUntil: 'networkidle2' });

            console.log('Step 2: Enter the departure city');
            console.log(departureCity);
            await page.waitForSelector('input[jsname="yrriRe"][class="II2One j0Ppje zmMKJ LbIaRd"]');
            await page.evaluate(() => {
                const inputElement = document.querySelector('input[jsname="yrriRe"][class="II2One j0Ppje zmMKJ LbIaRd"]');
                inputElement.value = '';
            });
            await page.type('input[jsname="yrriRe"][class="II2One j0Ppje zmMKJ LbIaRd"]', departureCity, { delay: 500 });
            await page.keyboard.press('Enter');


            console.log('Step 3: Enter the arrival city');
            console.log(arrivalCity);
            await page.waitForSelector('input[jsname="yrriRe"][placeholder="Where to?"]');
            await page.evaluate(() => {
                const inputElement = document.querySelector('input[jsname="yrriRe"][class="II2One j0Ppje zmMKJ LbIaRd"]');
                inputElement.value = '';
            });
            await page.type('input[jsname="yrriRe"][placeholder="Where to?"]', arrivalCity, { delay: 500 });
            await page.keyboard.press('Enter');

            console.log('Step 4: Enter the departure date');
            await page.waitForSelector('input[jsname="yrriRe"][aria-label="Departure"]');
            await page.type('input[jsname="yrriRe"][aria-label="Departure"]', departureDate);

            //   console.log('Step 5: Enter the return date');
            //   await page.waitForSelector('input[jsname="yrriRe"][aria-label="Return"]');
            //   await page.type('input[jsname="yrriRe"][aria-label="Return"]', returnDate);

            console.log('Step 6: Click the "Explore" button');
            await page.waitForSelector('button[jsname="vLv7Lb"][aria-label="Explore destinations"]');
            await page.click('button[jsname="vLv7Lb"][aria-label="Explore destinations"]');

            console.log('Step 7: Wait for the results page to load');
            await page.waitForSelector('.OgQvJf.nKlB3b', { timeout: 30000 });

            await page.waitForTimeout(5000);

            console.log('Step 8: Extract flight data from the search results');
            const flightData = await page.$$eval('.mxvQLc.ceis6c.uj4xv.uVdL1c.A8qKrc', (flightElements) => {
                const flights = [];

                flightElements.forEach((flightElement) => {
                    const airline = flightElement.querySelector('.sSHqwe.tPgKwe.ogfYpf span')?.textContent ?? 'N/A';
                    const departureTime = flightElement.querySelector('.zxVSec.YMlIz.tPgKwe.ogfYpf [aria-label^="Departure time"] span[role="text"]')?.textContent ?? 'N/A';
                    // const departureAirport = flightElement.querySelector('div.sSHqwe.tPgKwe span')?.textContent ?? 'N/A';
                    const arrivalTime = flightElement.querySelector('.zxVSec.YMlIz.tPgKwe.ogfYpf [aria-label^="Arrival time"] span[role="text"]')?.textContent ?? 'N/A';

                    // const arrivalAirport = flightElement.querySelector('.c8rWCd.sSHqwe.ogfYpf.tPgKwe span')?.textContent ?? 'N/A';
                    const price = flightElement.querySelector('span[data-gs]')?.textContent ?? 'N/A';

                    flights.push({
                        airline,
                        departureTime,
                        // departureAirport,
                        arrivalTime,
                        // arrivalAirport,
                        price,
                    });
                });

                return flights;
            });

            console.log(flightData); // Display the extracted flight data

            return flightData;
        } catch (error) {
            console.error('Error:', error);
            return [];
        } finally {
            //   await browser.close();
        }
    }

    console.log('Step 9: Perform flight search and send the results as JSON response');
    const flightData = await searchFlights();
    res.json(flightData);
});

app.listen(port, () => {
    console.log(`Express server is running on http://localhost:${port}`);
});
