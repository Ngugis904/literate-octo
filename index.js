const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const axios = 'axios'
const port = 3000;

app.use(bodyParser.json());
app.get('/', (req, res) => {
    console.log('Server 3 has been pinged')
    return res.status(200).json({ message: 'The server is running' });
});
const fetchLighthouseReport = async (url, apiKey, progressBar, Queue) => {
    const apiEndpoint = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=mobile&category=performance&category=accessibility&category=best-practices&category=seo&key=${apiKey}`;
    try {
        const response = await axios.get(apiEndpoint);
        const data = response.data;

        // Extract relevant information from the Lighthouse report
        const categoryScores = data.lighthouseResult.categories;
        const audits = data.lighthouseResult.audits;
        // Save the response data to a JSON file
        let contrast = audits["color-contrast"] ? audits["color-contrast"]["title"] : undefined;
        if (!contrast || contrast === 'Background and foreground colors have a sufficient contrast ratio') {
            contrast = 'NA';
        }

        let font = audits["font-size"] ? audits["font-size"]["title"] : undefined;
        if (!font || font === 'Document uses legible font sizes') {
            font = 'NA';
        }

        let links = audits["link-text"] ? audits["link-text"]["title"] : undefined;
        if (!links || links === 'Links have descriptive text') {
            links = 'NA';
        }
        

        const scores = {
            performance: categoryScores.performance.score * 100,
            accessibility: categoryScores.accessibility.score * 100,
            bestPractices: categoryScores['best-practices'].score * 100,
            seo: categoryScores.seo.score * 100,
            Contrast: contrast,
            User_Exprerience : font,
            Mobile_Friendly: links
        };

        return { url, scores };
    } catch (error) {
        console.error(`Error fetching Lighthouse report for  light_3 at ${url}:`, error.message);
    }
};

const fetchLighthouseReports = async (urls, apiKey, Queue) => {
    const start = performance.now();

    const validUrls = urls.filter(url => url.startsWith('http://') || url.startsWith('https://'));

    const queue = new Queue({ concurrency: 25 });

    const reportPromises = validUrls.map(url => queue.add(() => fetchLighthouseReport(url, apiKey, progressBar, Queue)));

    const reports = await Promise.allSettled(reportPromises);

    const fulfilledReports = reports.filter(result => result.status === 'fulfilled').map(result => result.value);

    const end = performance.now();
    const totalTime = end - start;
    console.log(`Total time taken: ${totalTime} milliseconds`);

    return fulfilledReports;
};

const main_3 = async (realUrls) => {
    const apiKey = 'AIzaSyAvlxYIxMW_JCLjthR7ue23kekVgVPyQQI';

    try {
        const Queue = await import('p-queue');
        const lighthouseReports = await fetchLighthouseReports(realUrls, apiKey, Queue.default);        
        return lighthouseReports
        // console.log('All Lighthouse reports have been saved in lighthouse_reports.json', lighthouseReports);
    } catch (error) {
        console.error('Error in main function:', error);
    }
};


app.post('/audit', async (req, res) => {
    const { urls } = req.body;

    if (!urls) {
        return res.status(400).json({ error: 'Invalid request. Please provide an array of URLs.' });
    }

    try {
        // const Queue = await import('p-queue');
        const lighthouseReports = await main_3(urls);
        console.log(lighthouseReports)
        res.json( lighthouseReports );
    } catch (error) {
        console.error('Error processing audit request:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
