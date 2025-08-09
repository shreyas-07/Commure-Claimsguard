
import axios from 'axios';

const API_BASE_URL = 'https://commure.shra012.com'; // Updated with correct port 8000

const transformToApiFormat = (claims) => {
    print(claims)
    return claims.map((claim) => ({
        claim_id: claim.claimId,
        codes: claim.procedureCodes,
        patient: {
            reference: claim?.patient?.reference
        },
        modifier:
            typeof claim.modifiers === 'string'
                ? claim.modifiers
                : Array.isArray(claim.modifiers) && claim.modifiers.length > 0
                    ? claim.modifiers[0]
                    : '0',
    }));
};


const transformSingleClaimToApiFormat = (claim) => {
    return {
        claim_id: claim.claimId,
        codes: claim.procedureCodes,
        patient: {
            reference: claim?.patient?.reference
        },
        modifier:
            typeof claim.modifiers === 'string'
                ? claim.modifiers
                : Array.isArray(claim.modifiers) && claim.modifiers.length > 0
                    ? claim.modifiers[0]
                    : '0',
    };
};

const api = {

    validateClaims: async (claimsData) => {
        try {
            const dataToSend =
                Array.isArray(claimsData) &&
                    claimsData.length > 0 &&
                    claimsData[0].claimId !== undefined
                    ? transformToApiFormat(claimsData)
                    : claimsData;

            console.log('Sending data to batch API:', dataToSend);

            const response = await axios.post(
                `${API_BASE_URL}/validate/batch`,
                dataToSend,
                {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );

            console.log('API response data:', response.data);


            if (!response.data.claims) {

                if (Array.isArray(response.data)) {
                    return { claims: response.data };
                } else {

                    return {
                        claims: [
                            {
                                claim_id: "Unknown",
                                approved: false,
                                results: [],
                                summary: "Invalid API response format"
                            }
                        ]
                    };
                }
            }

            return response.data;
        } catch (error) {
            return handleApiError(error);
        }
    },


    validateSingleClaim: async (claimData) => {
        try {

            const dataToSend = claimData.claimId !== undefined
                ? transformSingleClaimToApiFormat(claimData)
                : claimData;

            console.log('Sending data to single claim API:', dataToSend);

            const response = await axios.post(
                `${API_BASE_URL}/validate/single`,
                dataToSend,
                {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );

            console.log('Single claim API response:', response.data);


            if (!response.data.claims) {
                return {
                    claims: [
                        {
                            claim_id: dataToSend.claim_id || "Unknown",
                            approved: response.data.approved || false,
                            results: response.data.results || [],
                            summary: response.data.summary || "No validation summary available"
                        }
                    ]
                };
            }

            return response.data;
        } catch (error) {
            return handleApiError(error);
        }
    }
};


function handleApiError(error) {
    if (
        error.message &&
        (error.message.includes('Network Error') ||
            error.code === 'ERR_NETWORK')
    ) {
        console.error(
            'CORS Error: Unable to connect to the API due to CORS restrictions'
        );
        throw new Error(
            'Unable to connect to the API. This could be due to CORS restrictions.'
        );
    }

    if (error.response) {
        console.error('API Error Response:', error.response.data);
        console.error('Status:', error.response.status);
        throw new Error(
            error.response.data?.message || 'API responded with an error'
        );
    }

    console.error('API Error:', error);
    throw error;
}

export default api;