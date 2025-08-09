
import React, {
  useState,
  useEffect,
} from 'react';
import ClaimCard from './ClaimCard';
import ValidationResults from './ValidationResults';
import { useSelector } from 'react-redux';
import './ClaimResults.css'; 

const ClaimResults = () => {
  const [activeTab, setActiveTab] =
    useState('processed'); 


  const {
    processedClaims = [],
    loading = false,
    processError = null,
    validationResults = null,
    validating = false,
  } = useSelector((state) => state.claims || {});

  const hasValidationResults =
    validationResults &&
    validationResults.claims &&
    validationResults.claims.length > 0;


  useEffect(() => {
    console.log('ClaimResults Component State:', {
      activeTab,
      processedClaims: processedClaims.length,
      validationResults: hasValidationResults
        ? validationResults.claims.length
        : 0,
      loading,
      validating,
    });
  }, [
    activeTab,
    processedClaims,
    validationResults,
    loading,
    validating,
    hasValidationResults,
  ]);


  useEffect(() => {
    if (hasValidationResults) {
      console.log(
        'Auto-switching to validation tab due to results'
      );
      setActiveTab('validation');
    }
  }, [hasValidationResults]);

  if (loading || validating) {
    return (
      <div className="claims-container">
        <div className="claims-loading">
          <div className="claims-spinner"></div>
          <p className="claims-loading-text">
            {loading
              ? 'Processing claims...'
              : 'Validating claims...'}
          </p>
        </div>
      </div>
    );
  }

  if (processError) {
    return (
      <div className="claims-container">
        <div className="claims-error">
          <div className="claims-error-title">
            Error Processing Claims
          </div>
          <p className="claims-error-message">
            {processError}
          </p>
        </div>
      </div>
    );
  }


  if (
    (!processedClaims ||
      processedClaims.length === 0) &&
    !hasValidationResults
  ) {
    return (
      <div className="claims-container">
        <div className="claims-empty">
          <div className="claims-empty-icon">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <p className="claims-empty-title">
            No Claims Processed Yet
          </p>
          <p className="claims-empty-description">
            Submit claims using the form on the
            left to see results here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="claims-container">

      <div className="claims-tabs">
      
        <button
          onClick={() =>
            setActiveTab('validation')
          }
          className={`claims-tab ${
            activeTab === 'validation'
              ? 'active'
              : ''
          }`}
        >
          Validation Results
          {hasValidationResults && (
            <span className="claims-tab-badge">
              {validationResults.claims.length}
            </span>
          )}
        </button>
      </div>


      <div className="claims-content">
       

        <div
          className="h-full"
          style={{
            display:
              activeTab === 'validation'
                ? 'block'
                : 'none',
          }}
        >
          <ValidationResults />
        </div>
      </div>
    </div>
  );
};

export default ClaimResults;
