// src/redux/slices/claimSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { processClaimData } from '../../utils/claimProcessor';
import api from '../../utils/api';


const transformToApiFormat = (claims) => {
    return claims.map(claim => ({
        claim_id: claim.claimId,
        codes: claim.procedureCodes,
        patient: {
            reference: claim?.patient?.reference
        },
        modifier: claim.modifiers && claim.modifiers.length > 0 ? claim.modifiers[0] : "0"
    }));
};

export const validateClaimsApi = createAsyncThunk(
    'claims/validateClaimsApi',
    async (data, { rejectWithValue }) => {
        try {
            const apiFormattedData = transformToApiFormat(data);
            const response = await api.validateClaims(apiFormattedData);
            return response;
        } catch (error) {
            return rejectWithValue(error.message || 'API validation failed');
        }
    }
);

export const processClaims = createAsyncThunk(
    'claims/processClaims',
    async (data, { rejectWithValue }) => {
        try {
            if (!Array.isArray(data)) {
                throw new Error("Invalid data format. Expected an array of claims.");
            }
            return await processClaimData(data);
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

const claimSlice = createSlice({
    name: 'claims',
    initialState: {
        parsedClaims: [],
        processedClaims: [],
        validationResults: null,
        loading: false,
        validating: false,
        parseError: null,
        processError: null,
        validationError: null
    },
    reducers: {
        setParsedClaims: (state, action) => {
            try {
                state.parsedClaims = action.payload;
                state.parseError = null;
            } catch (error) {
                state.parseError = error.message;
            }
        },
        setParseError: (state, action) => {
            state.parseError = action.payload;
        },
        clearClaims: (state) => {
            state.parsedClaims = [];
            state.processedClaims = [];
            state.validationResults = null;
            state.parseError = null;
            state.processError = null;
            state.validationError = null;
        },
        // New reducer to manually set validation results (for testing purposes)
        setValidationResults: (state, action) => {
            state.validationResults = action.payload;
            state.validating = false;
            state.validationError = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // Process claims cases
            .addCase(processClaims.pending, (state) => {
                state.loading = true;
                state.processError = null;
            })
            .addCase(processClaims.fulfilled, (state, action) => {
                state.processedClaims = action.payload;
                state.loading = false;
            })
            .addCase(processClaims.rejected, (state, action) => {
                state.processError = action.payload;
                state.loading = false;
            })

            // Validate claims API cases
            .addCase(validateClaimsApi.pending, (state) => {
                state.validating = true;
                state.validationError = null;
            })
            .addCase(validateClaimsApi.fulfilled, (state, action) => {
                state.validationResults = action.payload;
                state.validating = false;
            })
            .addCase(validateClaimsApi.rejected, (state, action) => {
                state.validationError = action.payload;
                state.validating = false;
            });
    }
});

export const { setParsedClaims, setParseError, clearClaims, setValidationResults } = claimSlice.actions;
export default claimSlice.reducer;