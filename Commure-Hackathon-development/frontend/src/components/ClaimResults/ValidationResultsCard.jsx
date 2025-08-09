// src/components/ClaimResults/ValidationResultsCard.jsx
import React, {
  useState,
  useEffect,
} from 'react';

const ValidationResultsCard = ({ claim }) => {
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    console.log(
      `Card for claim ${claim?.claim_id} - expanded state: ${expanded}`
    );
  }, [expanded, claim]);

  if (!claim) {
    return (
      <div className="validation-card">
        <p className="text-yellow-800">
          Error: No claim data available
        </p>
      </div>
    );
  }

  const toggleExpand = () => {
    console.log(
      `Toggling expanded from ${expanded} to ${!expanded} for claim ${
        claim.claim_id
      }`
    );
    setExpanded((prevState) => !prevState);
  };

  return (
    <div
      className={`validation-card ${
        claim.approved ? 'approved' : 'rejected'
      }`}
    >
      <div className="validation-card-header compact">
        <h3 className="validation-card-title small">
          #{claim.claim_id || 'Unknown'}
        </h3>
        <div
          className={`validation-card-status small ${
            claim.approved
              ? 'status-approved'
              : 'status-rejected'
          }`}
        >
          {claim.approved
            ? '✅ Approved'
            : '❌ Partially Approved'}
        </div>
        <button
          onClick={toggleExpand}
          className={`validation-card-expand ${
            expanded ? 'expanded' : ''
          }`}
        >
          {expanded ? 'Hide' : 'Details'}
        </button>
      </div>

      <div className="validation-summary small">
        {claim.summary || 'No summary available'}
      </div>

      {expanded && (
        <div
          className="validation-detail-section compact"
          key={`details-${claim.claim_id}`}
        >
          <p className="validation-detail-title small">
            Validation Results
          </p>

          {claim.results &&
          claim.results.length > 0 ? (
            <div className="validation-details compact">
              {claim.results.map(
                (result, index) => (
                  <div
                    key={`${claim.claim_id}-result-${index}`}
                    className={`result-item compact ${
                      result.result?.includes(
                        '✅'
                      )
                        ? 'result-item-success'
                        : 'result-item-error'
                    }`}
                  >
                    <div className="result-codes">
                      {result.code1 && (
                        <span className="result-code small">
                          C1: {result.code1}
                        </span>
                      )}
                      {result.code2 && (
                        <span className="result-code small">
                          C2: {result.code2}
                        </span>
                      )}
                      {result.modifier &&
                        result.modifier !==
                          '0' && (
                          <span className="result-code result-modifier small">
                            Mod: {result.modifier}
                          </span>
                        )}
                    </div>
                    <p className="result-message small">
                      {result.result ||
                        'No result provided'}
                    </p>
                  </div>
                )
              )}
            </div>
          ) : (
            <p className="text-xs text-gray-400 px-2">
              No detailed validation results
              available
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default ValidationResultsCard;
