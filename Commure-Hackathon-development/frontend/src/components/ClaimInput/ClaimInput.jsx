import React from 'react';
import '../../index.css';
import JSONInput from './JSONInput';
import FileUpload from './FileUpload';
// import TestValidationButton from './TestValidationButton';
import ClaimTableDisplay from './ClaimTableDisplay';

const ClaimInput = () => {
  return (
    <div>
      <div className="flex items-center mb-4">
        <h2 className="section-title text-xl font-bold text-gray-900">
          Submit Claims
        </h2>
      </div>
      <div >
        <div className="flex flex-col space-y-6">
          <JSONInput />
          <br/>
          <div className="parsed-claims-scroll custom-scrollbar mt-6">
            <h3 className="section-header">Preview Claims</h3>
            <ClaimTableDisplay />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClaimInput;
