// src/components/Announcements.jsx (Hypothetical Update)

import React from 'react';

const Announcements = () => {
    // This is sample data, replace with your actual data fetching logic
    const dummyAnnouncements = [
        {
            id: 1,
            class: "SEA Comps-A",
            date: "Jul 15",
            message: "Hello Students For SEA. Note down the AOA notebook checking schedule for the entire semester. All should bring your notebook in the given time slot for checkingBatch A1 - Friday - 11.00 am to 11.30 amBatch A2 - Wednesday - 12.00 pm to 12.30 pmBatch A3 - Wednesday - 12.00 pm to 12.30 pm;"
        }
        // Add more announcements here
    ];

    return (
        // Key: w-full ensures this wrapper takes the full width of its parent section
        <div className="space-y-4 w-full"> 
            {dummyAnnouncements.map(announcement => (
                // Key: w-full ensures each card takes the full width of the Announcements wrapper
                <div key={announcement.id} className="bg-white rounded-xl sm:rounded-2xl p-4 shadow-[6px_6px_20px_rgba(0,0,0,0.1)] w-full">
                    
                    <div className="flex items-center mb-3">
                        {/* Profile/Avatar placeholder */}
                        <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center flex-shrink-0 mr-3">
                            <span className="text-white text-xs font-semibold">T</span> 
                        </div>
                        
                        <div>
                            <span className="font-bold text-gray-900 block">{announcement.class}</span>
                            <span className="text-sm text-gray-500">{announcement.date}</span>
                        </div>
                    </div>

                    <p className="text-gray-700 whitespace-pre-line">{announcement.message}</p>
                </div>
            ))}
        </div>
    );
};

export default Announcements;