// src/components/ClaimResults/ClaimCard.jsx
import React, {
  useState,
  useEffect,
} from 'react';

const ClaimCard = ({ claim }) => {
  const [expanded, setExpanded] = useState(false);


  useEffect(() => {
    console.log(
      `ClaimCard for ${claim?.claimId} - expanded state: ${expanded}`
    );
  }, [expanded, claim]);

  if (!claim) return null;


  const toggleExpand = () => {
    console.log(
      `Toggling expanded from ${expanded} to ${!expanded} for claim ${
        claim.claimId
      }`
    );
    setExpanded((prevState) => !prevState);
  };


  const getStatusClassNames = (status) => {
    switch (status) {
      case 'Approved':
        return {
          cardClass: 'approved',
          statusClass: 'status-approved',
        };
      case 'Denied':
        return {
          cardClass: 'rejected',
          statusClass: 'status-rejected',
        };
      case 'Pending Review':
        return {
          cardClass: 'pending',
          statusClass: 'status-pending',
        };
      case 'Needs Information':
        return {
          cardClass: 'needs-info',
          statusClass: 'status-needs-info',
        };
      default:
        return {
          cardClass: '',
          statusClass: '',
        };
    }
  };

  const statusClasses = getStatusClassNames(
    claim.status
  );

  const formattedAmount =
    typeof claim.amount === 'number'
      ? `$${claim.amount.toFixed(2)}`
      : claim.amount;

  return (
    <div
      className={`validation-card ${statusClasses.cardClass}`}
    >
      <div className="validation-card-header">
        <div>
          <h3 className="validation-card-title">
            {claim.patientName ||
              'Unknown Patient'}
            {claim.claimId && (
              <span className="ml-2 text-sm font-normal text-gray-500">
                (ID: {claim.claimId})
              </span>
            )}
          </h3>
          <div
            className={`validation-card-status ${statusClasses.statusClass}`}
          >
            {claim.status}
          </div>
        </div>
        <button
          onClick={toggleExpand}
          className="validation-card-expand"
        >
          {expanded ? 'Show Less' : 'Show More'}
        </button>
      </div>

      {expanded === true ? (
        <div key={`details-${claim.claimId}`}>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="bg-gray-50 p-3 rounded-md">
              <p className="text-xs uppercase font-semibold text-gray-500 mb-1">
                Amount
              </p>
              <p className="font-medium text-gray-900">
                {formattedAmount || 'N/A'}
              </p>
            </div>
            <div className="bg-gray-50 p-3 rounded-md">
              <p className="text-xs uppercase font-semibold text-gray-500 mb-1">
                Service Date
              </p>
              <p className="font-medium text-gray-900">
                {claim.serviceDate || 'N/A'}
              </p>
            </div>
          </div>

          <div className="mt-4">
            <div className="validation-summary">
              <p className="text-xs uppercase font-semibold text-gray-500 mb-2">
                Notes
              </p>
              <p className="text-sm text-gray-700">
                {claim.notes ||
                  'No notes available'}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500 text-xs uppercase font-semibold">
              Amount
            </p>
            <p className="font-medium text-gray-900">
              {formattedAmount || 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-gray-500 text-xs uppercase font-semibold">
              Service Date
            </p>
            <p className="font-medium text-gray-900">
              {claim.serviceDate || 'N/A'}
            </p>
          </div>
        </div>
      )}

      {!expanded && claim.notes && (
        <div className="mt-3 text-sm">
          <p className="text-gray-500 text-xs uppercase font-semibold">
            Notes
          </p>
          <p className="text-sm text-gray-700 truncate">
            {claim.notes}
          </p>
        </div>
      )}


      <div className="mt-4 pt-3 border-t border-gray-100">
        <p className="text-gray-500 text-xs uppercase font-semibold mb-2">
          Procedure Codes
        </p>
        <div className="result-codes">
          {claim.procedureCodes &&
          claim.procedureCodes.length > 0 ? (
            claim.procedureCodes.map(
              (code, index) => (
                <span
                  key={`code-${index}`}
                  className="result-code"
                >
                  {code}
                </span>
              )
            )
          ) : (
            <span className="text-xs text-gray-500">
              No procedure codes
            </span>
          )}
        </div>
      </div>


      <div className="validation-card-actions">
        <button className="action-button action-secondary">
          Edit
        </button>
        <button className="action-button action-primary action-approved">
          Process
        </button>
      </div>
    </div>
  );
};

export default ClaimCard;
