// src/components/ClaimInput/JSONInput.jsx
import '../../index.css';
import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import {
  setParsedClaims,
  setParseError,
  setValidationResults,
} from '../../redux/slices/claimSlice';
import {
  parseJSON,
  validateClaims,
} from '../../utils/parseHelper';
import api from '../../utils/api';

const JSONInput = () => {
  const [jsonText, setJsonText] = useState('');
  const [isProcessing, setIsProcessing] =
    useState(false);
  const [hasProcessed, setHasProcessed] =
    useState(false);
  const dispatch = useDispatch();


  const transformToApiFormat = (claims) => {
    return claims.map((claim) => ({
      claim_id: claim.claimId,
      codes: claim.procedureCodes,
       patient: {
            reference: claim?.patient?.reference
        },
      modifier:
        claim.modifiers &&
        claim.modifiers.length > 0
          ? typeof claim.modifiers === 'string'
            ? claim.modifiers
            : claim.modifiers[0]
          : '0',
    }));
  };

  const handleParse = async () => {
    try {
      if (!jsonText.trim()) {
        dispatch(
          setParseError('Please enter JSON data')
        );
        return;
      }

      setIsProcessing(true);

      const data = parseJSON(jsonText);
      const validatedData = validateClaims(data);
      dispatch(setParsedClaims(validatedData));

      const apiFormattedData =
        transformToApiFormat(validatedData);

      try {
        const response = await api.validateClaims(
          apiFormattedData
        );
        dispatch(setValidationResults(response));
      } catch (apiError) {
        console.error('API Error:', apiError);
        dispatch(
          setParseError(
            `API Error: ${apiError.message}`
          )
        );
      }

      setIsProcessing(false);
      setHasProcessed(true);

      setTimeout(
        () => setHasProcessed(false),
        3000
      );
    } catch (error) {
      console.error('Parse error:', error);
      dispatch(setParseError(error.message));
      setIsProcessing(false);
    }
  };

  const handlePaste = () => {
    navigator.clipboard
      .readText()
      .then((text) => setJsonText(text))
      .catch((err) =>
        console.error(
          'Failed to read clipboard:',
          err
        )
      );
  };

  const clearText = () => {
    setJsonText('');
    setHasProcessed(false);
    dispatch(setParsedClaims([]));
  };

  return (
    <div className="mt-6 px-4 pl-6 input-text-box">

      <div className="json-header-row">
        <h3 className="section-description">
          Paste JSON Claims Data
        </h3>
        <div className="json-buttons">
          <button
            onClick={handlePaste}
            className="btn btn-outline"
          >
            Paste
          </button>
          <button
            onClick={clearText}
            className="btn btn-outline"
          >
            Clear
          </button>
        </div>
      </div>


      <div className="relative">
        <textarea
          className="input textarea"
          style={{
            boxSizing: 'border-box',
            padding: '0.5rem',
            margin: '0 0',
          }}
          placeholder='[{"claim_id": "C1", "codes": ["0001A", "0591T"], "modifier": "1"}]'
          value={jsonText}
          onChange={(e) =>
            setJsonText(e.target.value)
          }
        />
        {jsonText && (
          <span className="absolute bottom-2 right-2 text-xs text-gray-500">
            {jsonText.length} characters
          </span>
        )}
      </div>


      <button
        onClick={handleParse}
        disabled={
          isProcessing || !jsonText.trim()
        }
        className={`
          btn btn-outline 
          ${
            hasProcessed
              ? 'btn-success'
              : 'btn-primary'
          } 
          mx-auto mt-3 
          ${
            isProcessing || !jsonText.trim()
              ? 'opacity-50 cursor-not-allowed'
              : 'hover:bg-blue-700'
          } 
          transition-colors duration-200
        `
          .replace(/\s+/g, ' ')
          .trim()}
      >
        {isProcessing ? (
          <>Processing...</>
        ) : hasProcessed ? (
          <>Processed Successfully</>
        ) : (
          <>Parse Claims</>
        )}
      </button>
    </div>
  );
};

export default JSONInput;
