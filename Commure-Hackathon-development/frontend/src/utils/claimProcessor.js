
export const processClaimData = (data) => {

    return new Promise((resolve, reject) => {
        setTimeout(() => {
            try {
                const processedClaims = data.map(claim => {

                    const statuses = ['Approved', 'Denied', 'Pending Review', 'Needs Information'];
                    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];

                    return {
                        ...claim,
                        status: randomStatus,
                        processed: new Date().toISOString(),
                        notes: getStatusNotes(randomStatus)
                    };
                });

                resolve(processedClaims);
            } catch (error) {
                reject(new Error(`Error processing claims: ${error.message}`));
            }
        }, 1500);
    });
};


export const getStatusNotes = (status) => {
    switch (status) {
        case 'Approved':
            return 'Claim has been approved. Payment will be processed within 3-5 business days.';
        case 'Denied':
            return 'Claim has been denied. Please check the denial reason and resubmit if needed.';
        case 'Pending Review':
            return 'Your claim is currently under review by our medical team.';
        case 'Needs Information':
            return 'Additional information is required. Please submit the requested documents.';
        default:
            return '';
    }
};