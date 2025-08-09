// src/redux/slices/parseSlice.js
import { createSlice } from '@reduxjs/toolkit';
import { validateClaims } from '../../utils/parseHelper';

const parseSlice = createSlice({
    name: 'parse',
    initialState: {
        rawData: null,
        parsedClaims: [],
        parseError: null
    },
    reducers: {
        setRawData: (state, action) => {
            state.rawData = action.payload;
        },
        parseClaims: (state, action) => {
            try {
                const validatedData = validateClaims(action.payload);
                state.parsedClaims = validatedData;
                state.parseError = null;
            } catch (error) {
                state.parseError = error.message;
            }
        },
        parseError: (state, action) => {
            state.parseError = action.payload;
        },
        clearParseData: (state) => {
            state.rawData = null;
            state.parsedClaims = [];
            state.parseError = null;
        }
    }
});

export const { setRawData, parseClaims, parseError, clearParseData } = parseSlice.actions;
export default parseSlice.reducer;