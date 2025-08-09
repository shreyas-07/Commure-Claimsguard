import Papa from 'papaparse';


export const parseJSON = (jsonString) => {
    try {
        return JSON.parse(jsonString);
    } catch (error) {
        throw new Error(`Invalid JSON: ${error.message}`);
    }
};


export const parseCSV = (file) => {
    return new Promise((resolve, reject) => {
        Papa.parse(file, {
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true,
            complete: (results) => {
                if (results.errors.length > 0) {
                    reject(new Error(`CSV parsing error: ${results.errors[0].message}`));
                } else {
                    resolve(results.data);
                }
            },
            error: (error) => {
                reject(new Error(`CSV parsing error: ${error.message}`));
            }
        });
    });
};


export const validateClaims = (claims) => {
    if (!Array.isArray(claims)) {
        throw new Error("Claims data must be an array");
    }
    console.log("Validating claims data..." + claims.length);

    const validatedClaims = claims.map((claim, index) => {
        const errors = [];


        if (!claim.claim_id) {
            errors.push("Missing claim ID");
        }


        let procedureCodes = [];


        if (claim.procedure_codes) {
            procedureCodes = Array.isArray(claim.procedure_codes)
                ? claim.procedure_codes
                : [claim.procedure_codes];
        }
        else if (claim.procedureCodes) {
            procedureCodes = Array.isArray(claim.procedureCodes)
                ? claim.procedureCodes
                : [claim.procedureCodes];
        }
        else if (claim.codes) {
            procedureCodes = Array.isArray(claim.codes)
                ? claim.codes
                : [claim.codes];
        }
        else if (claim.procedures) {
            if (Array.isArray(claim.procedures)) {
                procedureCodes = claim.procedures.map(p => p.code || p);
            } else {
                procedureCodes = [claim.procedures.code || claim.procedures];
            }
        }


        if (procedureCodes.length === 0) {
            errors.push("Missing procedure codes");
        }


        let modifier;
        if (claim.modifier !== undefined) {

            modifier = claim.modifier;
        }
        else if (claim.modifiers) {

            modifier = Array.isArray(claim.modifiers) && claim.modifiers.length > 0
                ? claim.modifiers[0]
                : (typeof claim.modifiers === 'string' ? claim.modifiers : "0");
        } else {
            modifier = "0";
        }


        const simplifiedClaim = {
            claimId: claim.claim_id || `Unknown-${index}`,
            procedureCodes: procedureCodes,
            modifiers: modifier, 
            patient: {
                reference: claim?.patient?.reference
            },
            isValid: errors.length === 0,
            errors
        };

        return simplifiedClaim;
    });

    console.log("Validated claims: " + validatedClaims.length);
    return validatedClaims;
};