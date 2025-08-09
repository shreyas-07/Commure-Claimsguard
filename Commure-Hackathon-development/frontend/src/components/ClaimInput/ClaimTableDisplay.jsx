import '../../index.css';
import React, { useState } from 'react';
import {
  useSelector,
  useDispatch,
} from 'react-redux';
import {
  clearClaims,
  setValidationResults,
} from '../../redux/slices/claimSlice';
import api from '../../utils/api';

const ClaimTableDisplay = () => {
  const { parsedClaims, parseError } =
    useSelector((state) => state.claims);
  const [isSubmitting, setIsSubmitting] =
    useState(false);
  const dispatch = useDispatch();

  const formatModifiers = (modifiers) => {
    if (typeof modifiers === 'string')
      return modifiers === '0'
        ? 'None'
        : modifiers;
    if (
      Array.isArray(modifiers) &&
      modifiers.length > 0
    )
      return modifiers.join(', ');
    return 'None';
  };

  const handleClearTable = () => {
    dispatch(clearClaims());
  };

  const handleSubmitClaim = async (claim) => {
    try {
      setIsSubmitting(true);
      const data = {
        claim_id: claim.claimId,
        codes: claim.procedureCodes,
        patient: {
            reference: claim?.patient?.reference
        },
        modifier: formatModifiers(
          claim.modifiers
        ),
      };

      const result =
        await api.validateSingleClaim(data);
      dispatch(setValidationResults(result));
      setIsSubmitting(false);
      alert(
        `Claim ${claim.claimId} submitted successfully!`
      );
    } catch (error) {
      console.error('Submit error:', error);
      alert(
        `Error submitting claim: ${error.message}`
      );
      setIsSubmitting(false);
    }
  };

  const handleSubmitAllClaims = async () => {
    try {
      setIsSubmitting(true);
      const formatted = parsedClaims.map(
        (claim) => ({
          claim_id: claim.claimId,
          codes: claim.procedureCodes,
          patient: {
            reference: claim?.patient?.reference
          },
          modifier: formatModifiers(
            claim.modifiers
          ),
        })
      );

      const result = await api.validateClaims(
        formatted
      );
      dispatch(setValidationResults(result));
      setIsSubmitting(false);
      alert('All claims submitted successfully!');
    } catch (error) {
      console.error('Batch submit error:', error);
      alert(
        `Error submitting claims: ${error.message}`
      );
      setIsSubmitting(false);
    }
  };

  if (parseError) {
    return (
      <div className="p-4 bg-red-100 border border-red-300 rounded">
        <p className="text-red-700 font-semibold">
          Error Parsing Claims
        </p>
        <p className="text-red-600 text-sm mt-1">
          {parseError}
        </p>
        <button
          onClick={handleClearTable}
          className="btn btn-outline mt-2 text-sm"
        >
          Clear
        </button>
      </div>
    );
  }

  if (!parsedClaims || parsedClaims.length === 0)
    return null;

  return (
    <div className="card overflow-x-auto rounded-lg shadow-sm border border-gray-200 bg-white">
      {/* Header */}
      <div className="card-header">
        <h3>Parsed Claims</h3>
        <div className="controls">
          <span>
            {parsedClaims.length} claim
            {parsedClaims.length > 1 ? 's' : ''}
          </span>
          <button onClick={handleClearTable}>
            Clear All
          </button>
          <button
            onClick={handleSubmitAllClaims}
            disabled={isSubmitting}
            className={`submit-btn ${
              isSubmitting
                ? 'cursor-not-allowed opacity-70'
                : ''
            }`}
          >
            {isSubmitting
              ? 'Submitting...'
              : 'Submit All'}
          </button>
        </div>
      </div>

      {/* Table */}
      <table className="claims-table w-full text-sm text-left">
        <thead>
          <tr>
            <th>Claim ID</th>
            <th>Codes</th>
            <th>Modifiers</th>
            <th>Valid</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {parsedClaims.map((claim, index) => (
            <tr
              key={
                claim.claimId || `claim-${index}`
              }
              className="hover:bg-gray-50 border-b"
            >
              <td className="px-4 py-2">
                {claim.claimId}
              </td>
              <td className="px-4 py-2">
                <div className="flex flex-wrap gap-2">
                  {claim.procedureCodes?.length >
                  0 ? (
                    claim.procedureCodes.map(
                      (code, i) => (
                        <span
                          key={i}
                          className="badge"
                        >
                          {code}
                        </span>
                      )
                    )
                  ) : (
                    <span className="text-gray-400">
                      None
                    </span>
                  )}
                </div>
              </td>
              <td className="px-4 py-2">
                {formatModifiers(claim.modifiers)}
              </td>
              <td className="px-4 py-2">
                {claim.isValid ? (
                  <span className="badge badge-success">
                    Valid
                  </span>
                ) : (
                  <span className="badge badge-error">
                    Invalid
                  </span>
                )}
              </td>
              <td className="px-4 py-2">
                <button
                  onClick={() =>
                    handleSubmitClaim(claim)
                  }
                  disabled={
                    !claim.isValid || isSubmitting
                  }
                  className={`btn btn-outline text-sm ${
                    !claim.isValid || isSubmitting
                      ? 'opacity-50 cursor-not-allowed'
                      : ''
                  }`}
                >
                  Submit
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ClaimTableDisplay;
