import * as XLSX from 'xlsx';

/**
 * Test function to verify base64 Excel file parsing
 */
export function testBase64Parsing(base64String: string) {
    try {
        console.log('Testing base64 parsing...');
        console.log('Base64 string length:', base64String.length);
        console.log('Base64 string sample:', base64String.substring(0, 100));
        
        // Check if it's valid base64
        const isValidBase64 = /^[A-Za-z0-9+/]*={0,2}$/.test(base64String) && 
                            base64String.length > 0 &&
                            base64String.length % 4 === 0;
        
        console.log('Is valid base64:', isValidBase64);
        
        if (!isValidBase64) {
            throw new Error('Invalid base64 format');
        }
        
        // Convert base64 to binary
        const binaryString = atob(base64String);
        console.log('Binary string length:', binaryString.length);
        
        // Convert to Uint8Array
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        
        console.log('Bytes array length:', bytes.length);
        
        // Try to parse as Excel
        let workbook;
        try {
            workbook = XLSX.read(bytes, { type: 'array' });
            console.log('Successfully parsed as Excel (array type)');
        } catch (error1) {
            try {
                workbook = XLSX.read(bytes.buffer, { type: 'buffer' });
                console.log('Successfully parsed as Excel (buffer type)');
            } catch (error2) {
                throw new Error('Failed to parse as Excel file');
            }
        }
        
        console.log('Workbook sheet names:', workbook.SheetNames);
        console.log('Number of sheets:', workbook.SheetNames.length);
        
        // Get first sheet data
        if (workbook.SheetNames.length > 0) {
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
            console.log('First sheet rows:', jsonData.length);
            console.log('First sheet sample data:', jsonData.slice(0, 3));
        }
        
        return {
            success: true,
            sheetNames: workbook.SheetNames,
            rowCount: workbook.SheetNames.length > 0 ? 
                XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { header: 1 }).length : 0
        };
        
    } catch (error) {
        console.error('Test failed:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

/**
 * Test with a sample base64 string (you can replace this with your actual data)
 */
export function runTest() {
    // This is a sample - replace with your actual base64 string from the API
    const sampleBase64 = "UEsDBBQABgAIAAAAIQBKkiWZnwEAAMQJAAATAAgCW0NvbnRlbnRfVHlwZXNdLnhtbCCiBAIooAACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
    
    const result = testBase64Parsing(sampleBase64);
    console.log('Test result:', result);
}
