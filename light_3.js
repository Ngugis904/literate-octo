const axios = require('axios');
const fs = require('fs').promises;
const { SingleBar, Presets } = require('cli-progress');
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
        progressBar.increment();
        return { url, scores };
    } catch (error) {
        console.error(`Error fetching Lighthouse report for  light_3 at ${url}:`, error.message);
    }
};

const fetchLighthouseReports = async (urls, apiKey, Queue) => {
    const start = performance.now();

    const validUrls = urls.filter(url => url.startsWith('http://') || url.startsWith('https://'));

    const totalRequests = validUrls.length;
    const progressBar = new SingleBar({
        format: 'Progress [{bar}] {percentage}% | ETA: {eta}s | {value}/{total}',
    }, Presets.shades_classic);

    progressBar.start(totalRequests, 0);

    const queue = new Queue({ concurrency: 25 });

    const reportPromises = validUrls.map(url => queue.add(() => fetchLighthouseReport(url, apiKey, progressBar, Queue)));

    const reports = await Promise.allSettled(reportPromises);

    const fulfilledReports = reports.filter(result => result.status === 'fulfilled').map(result => result.value);

    progressBar.stop();
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

module.exports= {main_3}
