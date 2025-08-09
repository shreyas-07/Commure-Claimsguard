// src/components/ClaimResults/ValidationResults.jsx
import React from 'react';
import ValidationResultsCard from './ValidationResultsCard';
import { useSelector } from 'react-redux';

const ValidationResults = () => {

  const {
    validationResults = null,
    validating = false,
    validationError = null,
  } = useSelector((state) => state.claims || {});

  if (validating) {
    return (
      <div className="claims-loading">
        <div className="claims-spinner"></div>
        <p className="claims-loading-text">
          Validating claims...
        </p>
      </div>
    );
  }

  if (validationError) {
    return (
      <div className="claims-error">
        <div className="claims-error-title">
          Error Validating Claims
        </div>
        <p className="claims-error-message">
          {validationError}
        </p>
      </div>
    );
  }

  // Check if we have results to display
  if (
    !validationResults ||
    !validationResults.claims ||
    validationResults.claims.length === 0
  ) {
    return (
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
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
        </div>
        <p className="claims-empty-title">
          No Validation Results Yet
        </p>
        <p className="claims-empty-description">
          Submit claims using the form on the left
          to see validation results here.
        </p>
      </div>
    );
  }

  // Calculate approval statistics
  const totalClaims =
    validationResults.claims.length;
  const approvedClaims =
    validationResults.claims.filter(
      (claim) => claim.approved
    ).length;
  const rejectedClaims =
    totalClaims - approvedClaims;

  return (
    <div className="claims-scroll-area">
      <div className="validation-stats">
        <div className="stat-card total-card">
          <p className="stat-label">
            Total Claims
          </p>
          <p className="stat-value stat-total">
            {totalClaims}
          </p>
        </div>
        <div className="stat-card approved-card">
          <p className="stat-label">Approved</p>
          <p className="stat-value stat-approved">
            {approvedClaims}
          </p>
        </div>
        <div className="stat-card rejected-card">
          <p className="stat-label">Partially Approved</p>
          <p className="stat-value stat-rejected">
            {rejectedClaims}
          </p>
        </div>
      </div>

      <div className="claims-cards">
        {validationResults.claims.map(
          (claim, index) => (
            <div
              key={`claim-${
                claim.claim_id || index
              }`}
            >
              <ValidationResultsCard
                claim={claim}
              />
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default ValidationResults;
