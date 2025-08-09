// src/redux/store.js
import { configureStore } from '@reduxjs/toolkit';
import claimReducer from './slices/claimSlice';
import parseReducer from './slices/parseSlice';

const store = configureStore({
    reducer: {
        claims: claimReducer,
        parse: parseReducer
    }
});

export default store;