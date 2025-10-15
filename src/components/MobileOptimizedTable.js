import React from 'react';

const MobileOptimizedTable = ({ 
  headers, 
  data, 
  renderRow, 
  mobileCardRenderer,
  className = "",
  emptyMessage = "No data available"
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={`responsive-table ${className}`}>
      {/* Desktop Table */}
      <div className="mobile-hidden">
        <table className="mobile-table">
          <thead>
            <tr>
              {headers.map((header, index) => (
                <th key={index} className="mobile-table-header">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr key={index} className="mobile-table-row">
                {renderRow(item, index)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="mobile-only mobile-spacing">
        {data.map((item, index) => (
          <div key={index} className="mobile-card">
            {mobileCardRenderer ? mobileCardRenderer(item, index) : (
              <div className="space-y-2">
                {headers.map((header, headerIndex) => (
                  <div key={headerIndex} className="flex justify-between">
                    <span className="font-medium text-gray-600">{header}:</span>
                    <span className="text-gray-900">
                      {renderRow(item, index)[headerIndex]?.props?.children || '-'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MobileOptimizedTable;