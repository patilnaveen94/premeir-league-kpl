// Find and add the website settings tab content
const websiteSettingsContent = `
            {/* Website Settings Tab */}
            {activeTab === 'website' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Website Settings</h2>
                </div>
                
                <div className="space-y-6">
                  {/* Player Registration Section Toggle */}
                  <div className="bg-white rounded-lg p-6 border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Player Registration Section</h3>
                    <p className="text-gray-600 mb-4">
                      Control the visibility of the player registration section on the home page.
                    </p>
                    
                    <div className="flex items-center space-x-4">
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="registrationVisibility"
                          checked={registrationSectionVisible}
                          onChange={() => {
                            if (!registrationSectionVisible) {
                              handleToggleRegistrationSection();
                            }
                          }}
                          className="w-4 h-4 text-green-600 focus:ring-green-500 border-gray-300"
                        />
                        <span className="text-sm font-medium text-gray-700">Show Registration Section</span>
                      </label>
                      
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="registrationVisibility"
                          checked={!registrationSectionVisible}
                          onChange={() => {
                            if (registrationSectionVisible) {
                              handleToggleRegistrationSection();
                            }
                          }}
                          className="w-4 h-4 text-red-600 focus:ring-red-500 border-gray-300"
                        />
                        <span className="text-sm font-medium text-gray-700">Hide Registration Section</span>
                      </label>
                    </div>
                    
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">
                        Current Status: 
                        <span className={\`ml-2 px-2 py-1 rounded-full text-xs font-medium \${
                          registrationSectionVisible ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }\`}>
                          {registrationSectionVisible ? 'Visible' : 'Hidden'}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
`;

console.log('Website settings content ready to be added to AdminPanel.js');